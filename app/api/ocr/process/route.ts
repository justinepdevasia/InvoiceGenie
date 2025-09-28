import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

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

    // Create the prompt for structured invoice extraction
    const extractionPrompt = `Extract the following invoice information and return it as JSON:
    - invoice_number: The invoice number or ID
    - invoice_date: The invoice date (format: YYYY-MM-DD)
    - due_date: The payment due date (format: YYYY-MM-DD)
    - vendor_name: Name of the vendor/seller
    - vendor_address: Complete address of the vendor
    - vendor_tax_id: Tax ID or registration number
    - customer_name: Name of the customer/buyer
    - customer_address: Complete address of the customer
    - subtotal: Subtotal amount before tax (number)
    - tax_rate: Tax rate percentage (number)
    - tax_amount: Total tax amount (number)
    - discount_amount: Discount amount if any (number)
    - total_amount: Total invoice amount including tax (number)
    - currency: Currency code (USD, EUR, etc.)
    - payment_terms: Payment terms and conditions
    - payment_method: Accepted payment methods
    - line_items: Array of items with description, quantity, unit_price, and amount
    - notes: Any additional notes
    - bank_details: Banking information (bank_name, account_number, routing_number, iban, swift)
    
    Return only valid JSON without any markdown formatting.`;

    console.log(`Processing file with type: ${fileType}`);

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
        include_image_base64: false
      })
    });

    console.log('OCR Response Status:', ocrResponse.status);
    
    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      console.error('Mistral OCR API error:', errorText);
      console.error('Response status:', ocrResponse.status);
      
      // Fallback to vision model for images only if OCR fails
      if (fileType && fileType.startsWith('image/')) {
        console.log('OCR failed, attempting fallback to vision model...');
        return fallbackToVisionModel(
          dataUrl, 
          invoiceId, 
          user.id, 
          supabase, 
          MISTRAL_API_KEY
        );
      } else {
        // For PDFs, we can't use vision fallback, so return the OCR error
        console.error('OCR failed for PDF file, no fallback available');
        
        await supabase
          .from('invoices')
          .update({ processing_status: 'failed' })
          .eq('id', invoiceId)
          .eq('user_id', user.id);
          
        return NextResponse.json({
          error: 'OCR processing failed for PDF',
          details: errorText,
          status: ocrResponse.status
        }, { status: ocrResponse.status });
      }
    }

    const ocrData = await ocrResponse.json();
    console.log('OCR Response Data:', JSON.stringify(ocrData, null, 2));
    
    // Parse the extracted data from Mistral OCR response
    let extractedData: any = {};
    let ocrText = '';

    try {
      // Extract text from OCR response
      if (ocrData.pages && ocrData.pages.length > 0) {
        // Get text from all pages - Mistral OCR uses 'markdown' field
        ocrText = ocrData.pages.map((page: any) => page.markdown || page.text || '').join('\n');
        console.log('Extracted OCR text:', ocrText.substring(0, 500));
      } else if (ocrData.text) {
        ocrText = ocrData.text;
        console.log('Found direct text:', ocrText.substring(0, 500));
      } else {
        console.error('No text found in OCR response. Response details:', {
          pages: ocrData.pages,
          pageCount: ocrData.pages?.length,
          usage: ocrData.usage_info,
          model: ocrData.model
        });

        // Try vision model fallback for images if OCR failed to extract text
        if (fileType && fileType.startsWith('image/')) {
          console.log('No OCR text found, attempting vision model fallback for image...');
          return fallbackToVisionModel(
            dataUrl,
            invoiceId,
            user.id,
            supabase,
            MISTRAL_API_KEY
          );
        } else {
          // For PDFs, create a basic record with minimal data
          console.log('No OCR text found for PDF, creating basic record...');
          extractedData = {
            invoice_number: 'FAILED_TO_EXTRACT',
            vendor_name: 'Unknown Vendor',
            total_amount: 0,
            currency: 'USD',
            error_details: 'OCR failed to extract text from document'
          };
        }
      }

      if (ocrText) {
        // Extract structured data directly from OCR text (no AI needed - saves costs!)
        console.log('Extracting data directly from OCR text...');
        extractedData = parseTextToInvoiceData(ocrText);
      }
    } catch (parseError) {
      console.error('Error processing OCR data:', parseError);
      console.error('Raw OCR data:', ocrData);

      // Try vision model fallback for images
      if (fileType && fileType.startsWith('image/')) {
        console.log('OCR parsing failed, attempting vision model fallback for image...');
        return fallbackToVisionModel(
          dataUrl,
          invoiceId,
          user.id,
          supabase,
          MISTRAL_API_KEY
        );
      } else {
        // Fallback to basic text parsing with empty text
        extractedData = parseTextToInvoiceData(ocrText || '');
        extractedData.error_details = 'OCR parsing failed: ' + (parseError instanceof Error ? parseError.message : String(parseError));
      }
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

    // Check and update user's usage
    const { data: profile } = await supabase
      .from('profiles')
      .select('pages_used, pages_limit')
      .eq('id', user.id)
      .single();

    if (profile) {
      await supabase
        .from('profiles')
        .update({ 
          pages_used: (profile.pages_used || 0) + 1
        })
        .eq('id', user.id);
    }

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

// Fallback function to use vision model if OCR API fails
async function fallbackToVisionModel(
  dataUrl: string,
  invoiceId: string,
  userId: string,
  supabase: any,
  apiKey: string
) {
  try {
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
                text: `Extract all invoice information from this image and return it as JSON with these fields: invoice_number, invoice_date, due_date, vendor_name, vendor_address, customer_name, customer_address, subtotal, tax_amount, total_amount, currency, line_items (array with description, quantity, unit_price, amount). Return only valid JSON.`
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
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error('Vision model failed');
    }

    const data = await response.json();
    const extractedData = JSON.parse(data.choices[0].message.content);

    // Store in database using flexible JSON approach
    const { data: invoiceData } = await supabase
      .from('invoice_data')
      .insert({
        invoice_id: invoiceId,
        invoice_number: extractedData.invoice_number || 'Unknown',
        vendor_name: extractedData.vendor_name || 'Unknown Vendor',
        currency: extractedData.currency || 'USD',
        raw_ocr_data: extractedData, // Store all extracted data in JSON field
        confidence_score: 0.75,
        is_verified: false
      })
      .select()
      .single();

    await supabase
      .from('invoices')
      .update({ processing_status: 'completed', page_count: 1 })
      .eq('id', invoiceId)
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      data: {
        invoice_data_id: invoiceData.id,
        extracted: extractedData,
        confidence_score: 0.75,
        pages_processed: 1,
        method: 'vision_fallback'
      }
    });
  } catch (error) {
    throw error;
  }
}

// Helper function to parse OCR text into structured invoice data
function parseTextToInvoiceData(text: string) {
  const data: any = {};

  // Handle empty or invalid text
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.log('Empty or invalid text provided to parseTextToInvoiceData');
    return {
      invoice_number: 'NO_TEXT_EXTRACTED',
      vendor_name: 'Unknown Vendor',
      total_amount: 0,
      currency: 'USD',
      error_details: 'No text content to parse'
    };
  }

  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Extract invoice number - try multiple patterns
  const invoicePatterns = [
    /invoice\s*#?:?\s*([A-Z0-9-]+)/i,
    /inv\s*#?:?\s*([A-Z0-9-]+)/i,
    /invoice\s*number\s*:?\s*([A-Z0-9-]+)/i,
    /document\s*#?:?\s*([A-Z0-9-]+)/i,
    /#\s*([A-Z0-9-]+)/i
  ];

  for (const pattern of invoicePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.invoice_number = match[1];
      break;
    }
  }

  // Extract amounts - try multiple patterns
  const amountPatterns = [
    /total\s*:?\s*\$?([0-9,]+\.?[0-9]*)/gi,
    /amount\s*:?\s*\$?([0-9,]+\.?[0-9]*)/gi,
    /grand\s*total\s*:?\s*\$?([0-9,]+\.?[0-9]*)/gi,
    /balance\s*:?\s*\$?([0-9,]+\.?[0-9]*)/gi,
    /\$\s*([0-9,]+\.?[0-9]*)/g
  ];

  const amounts: number[] = [];
  for (const pattern of amountPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount) && amount > 0) {
        amounts.push(amount);
      }
    }
  }

  if (amounts.length > 0) {
    data.total_amount = Math.max(...amounts); // Use highest amount as total
  }

  // Extract subtotal and tax
  const subtotalMatch = text.match(/subtotal\s*:?\s*\$?([0-9,]+\.?[0-9]*)/i);
  if (subtotalMatch) data.subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''));

  const taxMatch = text.match(/tax\s*:?\s*\$?([0-9,]+\.?[0-9]*)/i);
  if (taxMatch) data.tax_amount = parseFloat(taxMatch[1].replace(/,/g, ''));

  // Extract dates - try multiple patterns
  const datePatterns = [
    /date\s*:?\s*([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4})/i,
    /invoice\s*date\s*:?\s*([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4})/i,
    /([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{4})/g,
    /([0-9]{4}[-\/][0-9]{1,2}[-\/][0-9]{1,2})/g
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      data.invoice_date = formatDate(match[1]);
      break;
    }
  }

  // Extract due date
  const dueDateMatch = text.match(/due\s*date\s*:?\s*([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4})/i);
  if (dueDateMatch) data.due_date = formatDate(dueDateMatch[1]);

  // Extract vendor name - look for company-like patterns at the top
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    // Skip lines that look like headers or numbers
    if (line.length > 3 &&
        !line.match(/^[0-9\-\/\s]+$/) &&
        !line.toLowerCase().includes('invoice') &&
        !line.toLowerCase().includes('receipt') &&
        !line.toLowerCase().includes('bill')) {
      data.vendor_name = line;
      break;
    }
  }

  // Extract customer name - usually appears after "bill to" or "customer"
  const customerMatch = text.match(/(?:bill\s*to|customer|client)\s*:?\s*([^\n]+)/i);
  if (customerMatch) data.customer_name = customerMatch[1].trim();

  // Extract addresses - look for address-like patterns
  const addressPattern = /([0-9]+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|blvd|boulevard)[^\n]*)/i;
  const addressMatch = text.match(addressPattern);
  if (addressMatch) data.vendor_address = addressMatch[1].trim();

  // Determine currency from symbols in text
  if (text.includes('€') || text.toLowerCase().includes('eur')) {
    data.currency = 'EUR';
  } else if (text.includes('£') || text.toLowerCase().includes('gbp')) {
    data.currency = 'GBP';
  } else if (text.includes('¥') || text.toLowerCase().includes('jpy')) {
    data.currency = 'JPY';
  } else {
    data.currency = 'USD';
  }

  // Extract line items - look for table-like structures
  const lineItems = extractLineItems(text);
  if (lineItems.length > 0) {
    data.line_items = lineItems;
  }

  // Extract payment terms
  const paymentTermsMatch = text.match(/(?:payment\s*terms?|terms)\s*:?\s*([^\n]+)/i);
  if (paymentTermsMatch) data.payment_terms = paymentTermsMatch[1].trim();

  return data;
}

// Helper function to format dates consistently
function formatDate(dateStr: string): string {
  try {
    // Try to parse and format the date
    const date = new Date(dateStr.replace(/[-\/]/g, '/'));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    }
  } catch (e) {
    // If parsing fails, return original string
  }
  return dateStr;
}

// Helper function to extract line items from text
function extractLineItems(text: string): any[] {
  const lineItems: any[] = [];
  const lines = text.split('\n');

  // Look for table-like structures with quantity, description, and amount
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Pattern for: quantity | description | unit_price | amount
    const itemPattern = /(\d+)\s+(.+?)\s+\$?([0-9,]+\.?\d*)\s+\$?([0-9,]+\.?\d*)/;
    const match = line.match(itemPattern);

    if (match) {
      lineItems.push({
        quantity: parseInt(match[1]),
        description: match[2].trim(),
        unit_price: parseFloat(match[3].replace(/,/g, '')),
        amount: parseFloat(match[4].replace(/,/g, ''))
      });
    } else {
      // Simpler pattern for: description | amount
      const simplePattern = /(.+?)\s+\$?([0-9,]+\.?\d*)$/;
      const simpleMatch = line.match(simplePattern);

      if (simpleMatch && simpleMatch[2]) {
        const amount = parseFloat(simpleMatch[2].replace(/,/g, ''));
        if (amount > 0 && amount < (lineItems.length > 0 ? Math.max(...lineItems.map(item => item.amount || 0)) * 10 : 10000)) {
          lineItems.push({
            quantity: 1,
            description: simpleMatch[1].trim(),
            unit_price: amount,
            amount: amount
          });
        }
      }
    }
  }

  return lineItems;
}