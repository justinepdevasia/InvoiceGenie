import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      // Fallback to file download from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (downloadError) {
        console.error('Error downloading file:', downloadError);
        throw new Error('Failed to access file');
      }

      // Convert file to base64 for OCR processing
      const arrayBuffer = await fileData.arrayBuffer();
      base64 = Buffer.from(arrayBuffer).toString('base64');
      arrayBufferSize = arrayBuffer.byteLength;
      
      console.log('Downloaded from storage');
      console.log('File size in bytes:', arrayBufferSize);
      console.log('Base64 length:', base64.length);
      console.log('Base64 preview:', base64.substring(0, 100));
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
    let extractedData;
    let ocrText = '';

    try {
      // Extract text from OCR response
      if (ocrData.pages && ocrData.pages.length > 0) {
        // Get text from all pages
        ocrText = ocrData.pages.map((page: any) => page.text || '').join('\n');
        console.log('Extracted OCR text:', ocrText.substring(0, 500));
      } else if (ocrData.text) {
        ocrText = ocrData.text;
        console.log('Found direct text:', ocrText.substring(0, 500));
      } else {
        console.error('No text found in OCR response:', ocrData);
        throw new Error('No text extracted from document');
      }

      // Now extract structured data from the OCR text using AI
      if (ocrText.trim()) {
        console.log('Processing OCR text with AI for structured extraction...');

        // Use Mistral AI to extract structured data from the OCR text
        const structuredResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`
          },
          body: JSON.stringify({
            model: 'mistral-large-latest',
            messages: [
              {
                role: 'user',
                content: `Extract invoice information from this OCR text and return it as JSON:

${ocrText}

${extractionPrompt}`
              }
            ],
            temperature: 0.1,
            max_tokens: 2000,
            response_format: { type: 'json_object' }
          })
        });

        if (structuredResponse.ok) {
          const structuredData = await structuredResponse.json();
          extractedData = JSON.parse(structuredData.choices[0].message.content);
          console.log('AI extracted data:', extractedData);
        } else {
          console.warn('AI extraction failed, using text parsing fallback');
          extractedData = parseTextToInvoiceData(ocrText);
        }
      } else {
        extractedData = parseTextToInvoiceData(ocrText);
      }
    } catch (parseError) {
      console.error('Error processing OCR data:', parseError);
      console.error('Raw OCR data:', ocrData);
      // Fallback to basic text parsing
      extractedData = parseTextToInvoiceData(ocrText);
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

// Helper function to parse unstructured text into invoice data
function parseTextToInvoiceData(text: string) {
  const data: any = {};
  
  // Try to extract common invoice fields using regex patterns
  const invoiceNumberMatch = text.match(/invoice\s*#?\s*:?\s*([A-Z0-9-]+)/i);
  if (invoiceNumberMatch) data.invoice_number = invoiceNumberMatch[1];
  
  const totalMatch = text.match(/total\s*:?\s*\$?([0-9,]+\.?[0-9]*)/i);
  if (totalMatch) data.total_amount = parseFloat(totalMatch[1].replace(',', ''));
  
  const dateMatch = text.match(/date\s*:?\s*([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4})/i);
  if (dateMatch) data.invoice_date = dateMatch[1];
  
  // Extract vendor name (usually at the top)
  const lines = text.split('\n');
  if (lines.length > 0) {
    data.vendor_name = lines[0].trim();
  }
  
  // Default currency
  data.currency = text.includes('€') ? 'EUR' : text.includes('£') ? 'GBP' : 'USD';
  
  return data;
}