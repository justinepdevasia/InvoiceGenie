import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key for testing (bypasses RLS)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the invoice ID from query params
    const searchParams = request.nextUrl.searchParams
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
    }

    // Get invoice data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError) {
      return NextResponse.json({ error: 'Invoice not found', details: invoiceError }, { status: 404 })
    }

    console.log('Invoice found:', {
      id: invoice.id,
      file_path: invoice.file_path,
      original_file_name: invoice.original_file_name,
      file_type: invoice.file_type
    })

    if (!invoice.file_path) {
      return NextResponse.json({ error: 'No file path found for this invoice' }, { status: 404 })
    }

    // Test if the file exists in storage
    const { data: fileList, error: listError } = await supabase.storage
      .from('documents')
      .list('', {
        search: invoice.file_path
      })

    console.log('File search result:', { fileList, listError })

    // Try to generate signed URL
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(invoice.file_path, 3600)

    if (urlError) {
      return NextResponse.json({
        error: 'Failed to create signed URL',
        details: urlError,
        file_path: invoice.file_path
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        file_path: invoice.file_path,
        original_file_name: invoice.original_file_name,
        file_type: invoice.file_type
      },
      signed_url: signedUrl.signedUrl,
      file_exists: fileList && fileList.length > 0
    })

  } catch (error) {
    console.error('Test preview error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}