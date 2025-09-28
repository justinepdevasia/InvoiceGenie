import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { checkUsageLimit, incrementUsage } from '@/lib/usage';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr';

export async function POST(request: NextRequest) {
  let invoiceId: string | null = null;
  
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check usage limits before processing
    const usageCheck = await checkUsageLimit(user.id, 1);
    if (!usageCheck.success) {
      return NextResponse.json({
        error: 'Usage limit exceeded',
        details: usageCheck.error,
        remaining: usageCheck.remaining,
        limit: usageCheck.limit,
        upgrade_required: true
      }, { status: 429 });
    }

    const requestData = await request.json();
    const { invoiceId: reqInvoiceId, filePath, base64Data, fileType, fileName } = requestData;
    invoiceId = reqInvoiceId;

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Missing invoice ID' },
        { status: 400 }
      );
    }

    if (!base64Data && !filePath) {
      return NextResponse.json(
        { error: 'Missing file data' },
        { status: 400 }
      );
    }

    if (!MISTRAL_API_KEY) {
      console.error('Mistral API key not configured');
      return NextResponse.json(
        { error: 'OCR service not configured' },
        { status: 500 }
      );
    }

    // Update invoice status to processing
    const { error: updateError } = await supabase
      .from('invoices')
      .update({ processing_status: 'processing' })
      .eq('id', invoiceId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating invoice status:', updateError);
      throw new Error('Failed to update invoice status');
    }

    let base64, arrayBufferSize;
    
    if (base64Data) {
      // Use base64 data sent directly from client
      base64 = base64Data;
      arrayBufferSize = Math.ceil(base64.length * 3/4); // Approximate original size
      console.log('Using direct base64 data');
      console.log('Base64 length:', base64.length);
      console.log('Estimated file size:', arrayBufferSize);
      console.log('Base64 preview:', base64.substring(0, 100));
    } else {
      // Fallback to file download from storage using S3 protocol
      try {
        // Create S3 client with service role credentials for server-side access
        const s3Client = new S3Client({
          forcePathStyle: true,
          region: 'us-east-1',
          endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/s3`,
          credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || '',
            secretAccessKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
            // No sessionToken needed for service role
          },
        });

        const downloadCommand = new GetObjectCommand({
          Bucket: 'documents',
          Key: filePath,
        });

        const response = await s3Client.send(downloadCommand);
        if (!response.Body) {
          throw new Error('No file data received');
        }

        // Convert stream to buffer
        const chunks: Buffer[] = [];
        const stream = response.Body as any;

        for await (const chunk of stream) {
          chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);
        base64 = buffer.toString('base64');
        arrayBufferSize = buffer.length;

        console.log('Downloaded from S3 storage');
        console.log('File size in bytes:', arrayBufferSize);
        console.log('Base64 length:', base64.length);
        console.log('Base64 preview:', base64.substring(0, 100));
      } catch (s3Error) {
        console.error('S3 download error:', s3Error);
        throw new Error('Failed to download file from storage');
      }
    }
    
    // Validate file type and determine MIME type for the data URL
    let mimeType = fileType;
    if (fileType === 'application/pdf') {
      mimeType = 'application/pdf';
    } else if (fileType.startsWith('image/')) {
      mimeType = fileType;
    } else {
      console.error('Unsupported file type:', fileType);
      
      await supabase
        .from('invoices')
        .update({ processing_status: 'failed' })
        .eq('id', invoiceId)
        .eq('user_id', user.id);
        
      return NextResponse.json(
        { 
          error: 'Unsupported file type', 
          details: `File type "${fileType}" is not supported. Please upload PDF or image files (PNG, JPG, JPEG, GIF, WebP).` 
        },
        { status: 400 }
      );
    }
    
    const dataUrl = `data:${mimeType};base64,${base64}`;

    console.log(`Processing file with type: ${fileType}`);

    // Use Mistral Document Annotation for structured invoice data extraction
    // Based on updated API documentation, use the proper format
    const invoiceSchema = {
      type: 'json_schema',
      json_schema: {
        name: 'invoice_extraction',
        schema: {
          type: 'object',
          properties: {
            invoice_number: {
              type: 'string',
              description: 'The invoice number or document number'
            },
            invoice_date: {
              type: 'string',
              description: 'The date when the invoice was issued (YYYY-MM-DD format)'
            },
            due_date: {
              type: 'string',
              description: 'The payment due date (YYYY-MM-DD format)'
            },
            vendor_name: {
              type: 'string',
              description: 'The name of the vendor/supplier/company issuing the invoice'
            },
            vendor_address: {
              type: 'string',
              description: 'The full address of the vendor'
            },
            vendor_tax_id: {
              type: 'string',
              description: 'Tax ID, VAT number, or business registration number of the vendor'
            },
            customer_name: {
              type: 'string',
              description: 'The name of the customer/client being billed'
            },
            customer_address: {
              type: 'string',
              description: 'The billing address of the customer'
            },
            subtotal: {
              type: 'number',
              description: 'The subtotal amount before taxes and discounts'
            },
            tax_rate: {
              type: 'number',
              description: 'The tax rate percentage applied'
            },
            tax_amount: {
              type: 'number',
              description: 'The total tax amount'
            },
            discount_amount: {
              type: 'number',
              description: 'Any discount amount applied'
            },
            total_amount: {
              type: 'number',
              description: 'The final total amount to be paid'
            },
            currency: {
              type: 'string',
              description: 'The currency code (e.g., USD, EUR, GBP)'
            },
            payment_terms: {
              type: 'string',
              description: 'Payment terms (e.g., Net 30, Due on receipt)'
            },
            payment_method: {
              type: 'string',
              description: 'Accepted payment methods'
            },
            line_items: {
              type: 'array',
              description: 'Array of individual items/services on the invoice',
              items: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    description: 'Description of the item/service'
                  },
                  quantity: {
                    type: 'number',
                    description: 'Quantity of the item'
                  },
                  unit_price: {
                    type: 'number',
                    description: 'Price per unit'
                  },
                  amount: {
                    type: 'number',
                    description: 'Total amount for this line item'
                  }
                }
              }
            },
            notes: {
              type: 'string',
              description: 'Any additional notes or comments on the invoice'
            },
            bank_details: {
              type: 'object',
              description: 'Banking information for payment',
              properties: {
                bank_name: {
                  type: 'string',
                  description: 'Name of the bank'
                },
                account_number: {
                  type: 'string',
                  description: 'Bank account number'
                },
                routing_number: {
                  type: 'string',
                  description: 'Bank routing number'
                },
                iban: {
                  type: 'string',
                  description: 'International Bank Account Number'
                },
                swift: {
                  type: 'string',
                  description: 'SWIFT/BIC code'
                }
              }
            }
          },
          required: ['invoice_number', 'vendor_name', 'total_amount', 'currency']
        }
      }
    };

    const ocrResponse = await fetch(MISTRAL_OCR_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-ocr-latest',
        document: fileType === 'application/pdf' ? {
          type: 'document_url',
          document_url: dataUrl
        } : {
          type: 'image_url',
          image_url: dataUrl
        },
        document_annotation_format: invoiceSchema,
        include_image_base64: false
      })
    });

    console.log('OCR Response Status:', ocrResponse.status);

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      console.error('Mistral OCR API error:', errorText);
      console.error('Response status:', ocrResponse.status);

      // Fallback to vision model for structured extraction
      console.log('OCR failed, using vision model for structured extraction...');
      return extractStructuredDataWithVision(
        dataUrl,
        '',
        invoiceId,
        user.id,
        supabase,
        MISTRAL_API_KEY
      );
    }

    const ocrData = await ocrResponse.json();
    console.log('OCR Response Data:', JSON.stringify(ocrData, null, 2));

    // Extract structured data from annotation response
    let extractedData: any = {};

    try {
      if (ocrData.document_annotation) {
        // Document annotation contains the structured data as a JSON string
        if (typeof ocrData.document_annotation === 'string') {
          extractedData = JSON.parse(ocrData.document_annotation);
        } else {
          extractedData = ocrData.document_annotation;
        }
        console.log('Extracted structured data from document annotation:', extractedData);
      } else if (ocrData.annotations && ocrData.annotations.length > 0) {
        // Fallback if annotations are in a different structure
        extractedData = ocrData.annotations[0];
        console.log('Extracted from annotations array:', extractedData);
      } else {
        console.error('No structured data found in OCR response');
        throw new Error('No annotation data found in OCR response');
      }
    } catch (parseError) {
      console.error('Error processing OCR annotation data:', parseError);
      console.error('Raw OCR data:', ocrData);

      // Fallback to vision model for structured extraction
      console.log('Annotation parsing failed, using vision model for structured extraction...');
      return extractStructuredDataWithVision(
        dataUrl,
        '',
        invoiceId,
        user.id,
        supabase,
        MISTRAL_API_KEY
      );
    }
    
    console.log('Extracted data:', extractedData);

    // Calculate confidence score based on required fields presence (as decimal 0.0-1.0)
    const requiredFields = ['invoice_number', 'total_amount', 'currency', 'vendor_name'];
    const presentFields = requiredFields.filter(field => extractedData[field]);
    const confidenceScore = presentFields.length / requiredFields.length;

    // Store extracted data in database using flexible JSON approach
    const { data: invoiceData, error: dbError } = await supabase
      .from('invoice_data')
      .insert({
        invoice_id: invoiceId,
        invoice_number: extractedData.invoice_number || 'Unknown',
        vendor_name: extractedData.vendor_name || 'Unknown Vendor',
        total_amount: extractedData.total_amount || extractedData.total || extractedData.amount || 0,
        subtotal: extractedData.subtotal || 0,
        tax_amount: extractedData.tax_amount || extractedData.tax || 0,
        currency: extractedData.currency || 'USD',
        invoice_date: extractedData.invoice_date || null,
        due_date: extractedData.due_date || null,
        customer_name: extractedData.customer_name || null,
        customer_address: extractedData.customer_address || null,
        vendor_address: extractedData.vendor_address || null,
        payment_terms: extractedData.payment_terms || null,
        raw_ocr_data: extractedData, // Store all extracted data in JSON field
        confidence_score: confidenceScore,
        is_verified: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save extracted data');
    }

    // Store line items if present (line items are also stored in raw_ocr_data JSON)
    if (extractedData.line_items && Array.isArray(extractedData.line_items)) {
      const lineItems = extractedData.line_items.map((item: any, index: number) => ({
        invoice_data_id: invoiceData.id,
        item_number: index + 1,
        description: item.description || 'Item',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        amount: item.amount || 0
      }));

      if (lineItems.length > 0) {
        await supabase
          .from('invoice_line_items')
          .insert(lineItems);
      }
    }

    // Update invoice status
    await supabase
      .from('invoices')
      .update({ 
        processing_status: 'completed',
        page_count: 1
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id);

    // Update user's usage
    await incrementUsage(user.id, 1);

    return NextResponse.json({
      success: true,
      data: {
        invoice_data_id: invoiceData.id,
        extracted: extractedData,
        confidence_score: confidenceScore,
        pages_processed: 1
      }
    });

  } catch (error) {
    console.error('OCR processing error:', error);
    
    // Try to update invoice status to failed
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && invoiceId) {
        await supabase
          .from('invoices')
          .update({ processing_status: 'failed' })
          .eq('id', invoiceId)
          .eq('user_id', user.id);
      }
    } catch (updateError) {
      console.error('Failed to update invoice status:', updateError);
    }

    return NextResponse.json(
      { 
        error: 'OCR processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Function to extract structured data using vision model with optional OCR text
async function extractStructuredDataWithVision(
  dataUrl: string,
  ocrText: string,
  invoiceId: string,
  userId: string,
  supabase: any,
  apiKey: string
) {
  try {
    const prompt = ocrText.trim()
      ? `Based on this extracted text and the image, extract all invoice information and return it as JSON with these exact fields:
        invoice_number, invoice_date, due_date, vendor_name, vendor_address, vendor_tax_id, customer_name, customer_address,
        subtotal, tax_rate, tax_amount, discount_amount, total_amount, currency, payment_terms, payment_method,
        line_items (array with description, quantity, unit_price, amount), notes,
        bank_details (object with bank_name, account_number, routing_number, iban, swift).

        OCR Text: ${ocrText}

        Return only valid JSON.`
      : `Extract all invoice information from this image and return it as JSON with these exact fields:
        invoice_number, invoice_date, due_date, vendor_name, vendor_address, vendor_tax_id, customer_name, customer_address,
        subtotal, tax_rate, tax_amount, discount_amount, total_amount, currency, payment_terms, payment_method,
        line_items (array with description, quantity, unit_price, amount), notes,
        bank_details (object with bank_name, account_number, routing_number, iban, swift).

        Return only valid JSON.`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'pixtral-large-latest',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error('Vision model failed');
    }

    const data = await response.json();
    const extractedData = JSON.parse(data.choices[0].message.content);

    console.log('Structured data extracted:', extractedData);

    // Calculate confidence score based on required fields presence (as decimal 0.0-1.0)
    const requiredFields = ['invoice_number', 'total_amount', 'currency', 'vendor_name'];
    const presentFields = requiredFields.filter(field => extractedData[field]);
    const confidenceScore = presentFields.length / requiredFields.length;

    // Store extracted data in database using flexible JSON approach
    const { data: invoiceData, error: dbError } = await supabase
      .from('invoice_data')
      .insert({
        invoice_id: invoiceId,
        invoice_number: extractedData.invoice_number || 'Unknown',
        vendor_name: extractedData.vendor_name || 'Unknown Vendor',
        total_amount: extractedData.total_amount || extractedData.total || extractedData.amount || 0,
        subtotal: extractedData.subtotal || 0,
        tax_amount: extractedData.tax_amount || extractedData.tax || 0,
        currency: extractedData.currency || 'USD',
        invoice_date: extractedData.invoice_date || null,
        due_date: extractedData.due_date || null,
        customer_name: extractedData.customer_name || null,
        customer_address: extractedData.customer_address || null,
        vendor_address: extractedData.vendor_address || null,
        payment_terms: extractedData.payment_terms || null,
        raw_ocr_data: extractedData, // Store all extracted data in JSON field
        confidence_score: confidenceScore,
        is_verified: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save extracted data');
    }

    // Store line items if present
    if (extractedData.line_items && Array.isArray(extractedData.line_items)) {
      const lineItems = extractedData.line_items.map((item: any, index: number) => ({
        invoice_data_id: invoiceData.id,
        item_number: index + 1,
        description: item.description || 'Item',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        amount: item.amount || 0
      }));

      if (lineItems.length > 0) {
        await supabase
          .from('invoice_line_items')
          .insert(lineItems);
      }
    }

    // Update invoice status
    await supabase
      .from('invoices')
      .update({
        processing_status: 'completed',
        page_count: 1
      })
      .eq('id', invoiceId)
      .eq('user_id', userId);

    // Update user's usage
    await incrementUsage(userId, 1);

    return NextResponse.json({
      success: true,
      data: {
        invoice_data_id: invoiceData.id,
        extracted: extractedData,
        confidence_score: confidenceScore,
        pages_processed: 1,
        method: ocrText.trim() ? 'ocr_plus_vision' : 'vision_only'
      }
    });
  } catch (error) {
    console.error('Vision model extraction error:', error);
    throw error;
  }
}


