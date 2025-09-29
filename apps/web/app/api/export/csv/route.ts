import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project');
    const invoiceId = searchParams.get('invoice');
    const format = searchParams.get('format') || 'full'; // full, summary, line_items

    let query = supabase
      .from('invoices')
      .select(`
        *,
        project:projects(name),
        invoice_data(
          *,
          invoice_line_items(*)
        )
      `)
      .eq('user_id', user.id)
      .eq('processing_status', 'completed');

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    if (invoiceId) {
      query = query.eq('id', invoiceId);
    }

    const { data: invoices, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ error: 'No invoices found' }, { status: 404 });
    }

    // Generate CSV based on format
    let csv = '';
    const delimiter = ',';
    
    if (format === 'summary') {
      // Summary format - one row per invoice
      csv = [
        'Invoice Number',
        'Invoice Date',
        'Due Date',
        'Vendor Name',
        'Customer Name',
        'Subtotal',
        'Tax Amount',
        'Total Amount',
        'Currency',
        'Project',
        'File Name',
        'Verified',
        'Upload Date'
      ].join(delimiter) + '\n';

      invoices.forEach(invoice => {
        const data = invoice.invoice_data?.[0];
        if (data) {
          csv += [
            escapeCSV(data.invoice_number),
            data.invoice_date || '',
            data.due_date || '',
            escapeCSV(data.vendor_name),
            escapeCSV(data.customer_name || ''),
            data.subtotal,
            data.tax_amount,
            data.total_amount,
            data.currency,
            escapeCSV(invoice.project?.name || ''),
            escapeCSV(invoice.original_file_name),
            data.is_verified ? 'Yes' : 'No',
            invoice.created_at
          ].join(delimiter) + '\n';
        }
      });
    } else if (format === 'line_items') {
      // Line items format - one row per line item
      csv = [
        'Invoice Number',
        'Vendor Name',
        'Invoice Date',
        'Item Description',
        'Quantity',
        'Unit Price',
        'Line Amount',
        'Currency',
        'Project'
      ].join(delimiter) + '\n';

      invoices.forEach(invoice => {
        const data = invoice.invoice_data?.[0];
        if (data && data.invoice_line_items) {
          data.invoice_line_items.forEach((item: any) => {
            csv += [
              escapeCSV(data.invoice_number),
              escapeCSV(data.vendor_name),
              data.invoice_date || '',
              escapeCSV(item.description),
              item.quantity,
              item.unit_price,
              item.amount,
              data.currency,
              escapeCSV(invoice.project?.name || '')
            ].join(delimiter) + '\n';
          });
        }
      });
    } else {
      // Full format - comprehensive data
      csv = [
        'Invoice Number',
        'Invoice Date',
        'Due Date',
        'Vendor Name',
        'Vendor Address',
        'Customer Name',
        'Customer Address',
        'Subtotal',
        'Tax Amount',
        'Total Amount',
        'Currency',
        'Payment Terms',
        'Line Items Count',
        'Project',
        'File Name',
        'Page Count',
        'Confidence Score',
        'Verified',
        'Processing Status',
        'Upload Date'
      ].join(delimiter) + '\n';

      invoices.forEach(invoice => {
        const data = invoice.invoice_data?.[0];
        if (data) {
          const rawData = data.raw_ocr_data || {};
          csv += [
            escapeCSV(data.invoice_number),
            data.invoice_date || '',
            data.due_date || '',
            escapeCSV(data.vendor_name),
            escapeCSV(data.vendor_address || ''),
            escapeCSV(data.customer_name || ''),
            escapeCSV(rawData.customer_address || ''),
            data.subtotal,
            data.tax_amount,
            data.total_amount,
            data.currency,
            escapeCSV(rawData.payment_terms || ''),
            data.invoice_line_items?.length || 0,
            escapeCSV(invoice.project?.name || ''),
            escapeCSV(invoice.original_file_name),
            invoice.page_count,
            data.confidence_score,
            data.is_verified ? 'Yes' : 'No',
            invoice.processing_status,
            invoice.created_at
          ].join(delimiter) + '\n';
        }
      });
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = projectId 
      ? `invoices-project-${timestamp}.csv`
      : invoiceId
      ? `invoice-${invoiceId.substring(0, 8)}.csv`
      : `invoices-all-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to escape CSV values
function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // If the value contains comma, newline, or quotes, wrap in quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    // Escape existing quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}