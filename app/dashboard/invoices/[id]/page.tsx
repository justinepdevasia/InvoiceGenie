'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Save,
  Download,
  CheckCircle,
  AlertCircle,
  Edit2,
  FileText,
  Calendar,
  DollarSign,
  Building,
  User,
  Hash,
  Globe,
  CreditCard,
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { format } from 'date-fns';

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string | null;
  due_date: string | null;
  vendor_name: string;
  vendor_address: string | null;
  customer_name: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  raw_ocr_data: any;
  confidence_score: number;
  is_verified: boolean;
}

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Invoice {
  id: string;
  original_file_url: string;
  original_file_name: string;
  processing_status: string;
  page_count: number;
  created_at: string;
  project: {
    id: string;
    name: string;
  };
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (params.id) {
      fetchInvoiceDetails();
    }
  }, [params.id]);

  async function fetchInvoiceDetails() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch invoice with project info
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          project:projects(id, name)
        `)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

      if (invoiceError) throw invoiceError;
      setInvoice(invoiceData);

      // Generate signed URL for file preview
      if (invoiceData.original_file_url && !invoiceData.original_file_url.startsWith('direct-processing/')) {
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from('invoices')
          .createSignedUrl(invoiceData.original_file_url, 3600); // 1 hour expiry
        
        if (!urlError && signedUrl) {
          setFileUrl(signedUrl.signedUrl);
        }
      } else {
        // For direct-processing files, we don't have a preview available
        console.log('File was processed directly, preview not available');
        setFileUrl(null);
      }

      // Fetch invoice extracted data
      const { data: extractedData, error: dataError } = await supabase
        .from('invoice_data')
        .select('*')
        .eq('invoice_id', params.id)
        .single();

      if (extractedData) {
        // If structured fields are empty but raw_ocr_data exists, populate from JSON
        const populatedData = { ...extractedData };
        if (extractedData.raw_ocr_data && !extractedData.subtotal) {
          const ocrData = extractedData.raw_ocr_data;
          populatedData.invoice_date = populatedData.invoice_date || ocrData.invoice_date || null;
          populatedData.due_date = populatedData.due_date || ocrData.due_date || null;
          populatedData.vendor_address = populatedData.vendor_address || ocrData.vendor_address || null;
          populatedData.customer_name = populatedData.customer_name || ocrData.customer_name || null;
          populatedData.subtotal = populatedData.subtotal || ocrData.subtotal || 0;
          populatedData.tax_amount = populatedData.tax_amount || ocrData.tax_amount || 0;
          populatedData.total_amount = populatedData.total_amount || ocrData.total_amount || 0;
        }
        
        setInvoiceData(populatedData);

        // Fetch line items from database first
        const { data: items, error: itemsError } = await supabase
          .from('invoice_line_items')
          .select('*')
          .eq('invoice_data_id', extractedData.id)
          .order('id');

        if (!itemsError && items && items.length > 0) {
          setLineItems(items);
        } else if (extractedData.raw_ocr_data?.line_items) {
          // If no line items in database, populate from raw_ocr_data
          setLineItems(extractedData.raw_ocr_data.line_items);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!invoiceData) return;

    setIsSaving(true);
    try {
      // Create updated raw_ocr_data JSON with all current values
      const updatedRawData = {
        ...(invoiceData.raw_ocr_data || {}),
        invoice_number: invoiceData.invoice_number,
        invoice_date: invoiceData.invoice_date,
        due_date: invoiceData.due_date,
        vendor_name: invoiceData.vendor_name,
        vendor_address: invoiceData.vendor_address,
        customer_name: invoiceData.customer_name,
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.tax_amount,
        total_amount: invoiceData.total_amount,
        currency: invoiceData.currency,
        line_items: lineItems // Include updated line items in JSON
      };

      // Update invoice data with both structured fields AND raw_ocr_data JSON
      const { error: updateError } = await supabase
        .from('invoice_data')
        .update({
          invoice_number: invoiceData.invoice_number,
          invoice_date: invoiceData.invoice_date,
          due_date: invoiceData.due_date,
          vendor_name: invoiceData.vendor_name,
          vendor_address: invoiceData.vendor_address,
          customer_name: invoiceData.customer_name,
          subtotal: invoiceData.subtotal,
          tax_amount: invoiceData.tax_amount,
          total_amount: invoiceData.total_amount,
          currency: invoiceData.currency,
          raw_ocr_data: updatedRawData, // Update JSON too to keep in sync
          is_verified: true
        })
        .eq('id', invoiceData.id);

      if (updateError) throw updateError;

      // Delete existing line items
      await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_data_id', invoiceData.id);

      // Insert updated line items
      if (lineItems.length > 0) {
        const itemsToInsert = lineItems.map(item => ({
          invoice_data_id: invoiceData.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount
        }));

        const { error: itemsError } = await supabase
          .from('invoice_line_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      setIsEditing(false);
      alert('Invoice data saved successfully');
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice data');
    } finally {
      setIsSaving(false);
    }
  }

  function addLineItem() {
    setLineItems([...lineItems, {
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0
    }]);
  }

  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
    recalculateTotals();
  }

  function updateLineItem(index: number, field: keyof LineItem, value: any) {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    
    // Recalculate amount if quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = updated[index].quantity * updated[index].unit_price;
    }
    
    setLineItems(updated);
    recalculateTotals();
  }

  function recalculateTotals() {
    if (!invoiceData) return;
    
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = invoiceData.tax_amount && invoiceData.subtotal 
      ? (invoiceData.tax_amount / invoiceData.subtotal) 
      : 0.1; // Default 10% tax
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    setInvoiceData({
      ...invoiceData,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Invoice not found</h2>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/projects/${invoice.project.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{invoice.original_file_name}</h1>
            <p className="text-muted-foreground mt-1">
              Project: {invoice.project.name} • Uploaded {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoiceData && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRawData(!showRawData)}
              >
                {showRawData ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showRawData ? 'Hide' : 'Show'} Raw Data
              </Button>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </>
          )}
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                const response = await fetch(`/api/export/csv?invoice=${params.id}&format=full`);
                if (!response.ok) throw new Error('Export failed');
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `invoice-${invoiceData?.invoice_number || params.id}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error('Export error:', error);
                alert('Failed to export CSV');
              }
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Preview */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle>Document Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-4 overflow-auto" style={{ maxHeight: '80vh' }}>
              {fileUrl ? (
                invoice.original_file_type && invoice.original_file_type.startsWith('image/') ? (
                  // For images, use img tag with responsive sizing
                  <div className="flex items-center justify-center">
                    <img
                      src={fileUrl}
                      alt="Invoice"
                      className="max-w-full h-auto rounded shadow-lg"
                      style={{ 
                        maxHeight: '70vh',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                ) : (
                  // For PDFs and other documents, use iframe
                  <iframe
                    src={fileUrl}
                    className="w-full rounded"
                    style={{ 
                      height: '70vh',
                      minHeight: '500px'
                    }}
                    title="Invoice Preview"
                  />
                )
              ) : invoice.original_file_url ? (
                <div className="text-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading preview...</p>
                </div>
              ) : (
                <div className="text-center py-20">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Preview not available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Extracted Data */}
        <div className="space-y-6">
          {invoice.processing_status === 'processing' ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold">Processing Document...</h3>
                <p className="text-muted-foreground mt-2">
                  Extracting data with Mistral AI OCR
                </p>
              </CardContent>
            </Card>
          ) : invoiceData ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Invoice Information</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant={invoiceData.is_verified ? "default" : "secondary"}>
                        {invoiceData.is_verified ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Verified
                          </>
                        ) : (
                          'Unverified'
                        )}
                      </Badge>
                      <Badge variant="outline">
                        Confidence: {(invoiceData.confidence_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoice_number">
                        <Hash className="inline h-3 w-3 mr-1" />
                        Invoice Number
                      </Label>
                      <Input
                        id="invoice_number"
                        value={invoiceData.invoice_number}
                        onChange={(e) => setInvoiceData({...invoiceData, invoice_number: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">
                        <Globe className="inline h-3 w-3 mr-1" />
                        Currency
                      </Label>
                      <Input
                        id="currency"
                        value={invoiceData.currency}
                        onChange={(e) => setInvoiceData({...invoiceData, currency: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoice_date">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        Invoice Date
                      </Label>
                      <Input
                        id="invoice_date"
                        type="date"
                        value={invoiceData.invoice_date || ''}
                        onChange={(e) => setInvoiceData({...invoiceData, invoice_date: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="due_date">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        Due Date
                      </Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={invoiceData.due_date || ''}
                        onChange={(e) => setInvoiceData({...invoiceData, due_date: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="vendor_name">
                      <Building className="inline h-3 w-3 mr-1" />
                      Vendor Name
                    </Label>
                    <Input
                      id="vendor_name"
                      value={invoiceData.vendor_name}
                      onChange={(e) => setInvoiceData({...invoiceData, vendor_name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendor_address">Vendor Address</Label>
                    <Textarea
                      id="vendor_address"
                      value={invoiceData.vendor_address || ''}
                      onChange={(e) => setInvoiceData({...invoiceData, vendor_address: e.target.value})}
                      disabled={!isEditing}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_name">
                      <User className="inline h-3 w-3 mr-1" />
                      Customer Name
                    </Label>
                    <Input
                      id="customer_name"
                      value={invoiceData.customer_name || ''}
                      onChange={(e) => setInvoiceData({...invoiceData, customer_name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Amounts</Label>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="subtotal">Subtotal</Label>
                        <Input
                          id="subtotal"
                          type="number"
                          step="0.01"
                          value={invoiceData.subtotal}
                          onChange={(e) => setInvoiceData({...invoiceData, subtotal: parseFloat(e.target.value)})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax_amount">Tax</Label>
                        <Input
                          id="tax_amount"
                          type="number"
                          step="0.01"
                          value={invoiceData.tax_amount}
                          onChange={(e) => setInvoiceData({...invoiceData, tax_amount: parseFloat(e.target.value)})}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="total_amount">Total</Label>
                        <Input
                          id="total_amount"
                          type="number"
                          step="0.01"
                          value={invoiceData.total_amount}
                          onChange={(e) => setInvoiceData({...invoiceData, total_amount: parseFloat(e.target.value)})}
                          disabled={!isEditing}
                          className="font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Line Items</CardTitle>
                    {isEditing && (
                      <Button size="sm" variant="outline" onClick={addLineItem}>
                        <Plus className="mr-1 h-4 w-4" />
                        Add Item
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {lineItems.length > 0 ? (
                    <div className="space-y-3">
                      {lineItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              disabled={!isEditing}
                              placeholder="Item description"
                            />
                          </div>
                          <div className="w-20 space-y-1">
                            <Label className="text-xs">Qty</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="w-24 space-y-1">
                            <Label className="text-xs">Unit Price</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value))}
                              disabled={!isEditing}
                            />
                          </div>
                          <div className="w-24 space-y-1">
                            <Label className="text-xs">Amount</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.amount}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          {isEditing && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No line items found
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Raw OCR Data */}
              {showRawData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Raw OCR Data</CardTitle>
                    <CardDescription>
                      Original data extracted by Mistral AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
                      {JSON.stringify(invoiceData.raw_ocr_data, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </>
          ) : invoice.processing_status === 'failed' ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Processing Failed</h3>
                <p className="text-muted-foreground mt-2">
                  Failed to extract data from this document
                </p>
                <Button className="mt-4" variant="outline">
                  Retry Processing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">No Data Available</h3>
                <p className="text-muted-foreground mt-2">
                  This invoice hasn't been processed yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}