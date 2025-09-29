import { format, parseISO, isValid } from 'date-fns';
import type { Invoice, InvoiceData, ExpenseAnalysis, MonthlyExpenseData } from '@expensa/shared-types';

// Date utilities
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
  } catch {
    return 'Invalid Date';
  }
};

export const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'MMM dd, yyyy HH:mm') : 'Invalid Date';
  } catch {
    return 'Invalid Date';
  }
};

// Currency utilities
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

export const parseCurrency = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[^0-9.-]+/g, '');
  return parseFloat(cleaned) || 0;
};

// File utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileTypeIcon = (fileType: string): string => {
  if (fileType === 'application/pdf') return '📄';
  if (fileType.startsWith('image/')) return '🖼️';
  return '📎';
};

// Status utilities
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'success';
    case 'processing': return 'warning';
    case 'failed': return 'error';
    case 'pending': return 'info';
    default: return 'default';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'completed': return 'Completed';
    case 'processing': return 'Processing';
    case 'failed': return 'Failed';
    case 'pending': return 'Pending';
    default: return 'Unknown';
  }
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Data processing utilities
export const calculateTotalAmount = (invoices: Invoice[]): number => {
  return invoices.reduce((total, invoice) => {
    const invoiceData = invoice.invoice_data?.[0];
    return total + (invoiceData?.total_amount || 0);
  }, 0);
};

export const groupInvoicesByMonth = (invoices: Invoice[]): MonthlyExpenseData[] => {
  const groups: { [key: string]: { total: number; count: number } } = {};

  invoices.forEach(invoice => {
    const invoiceData = invoice.invoice_data?.[0];
    if (!invoiceData) return;

    const date = invoiceData.invoice_date || invoice.created_at;
    const monthKey = format(parseISO(date), 'yyyy-MM');

    if (!groups[monthKey]) {
      groups[monthKey] = { total: 0, count: 0 };
    }

    groups[monthKey].total += invoiceData.total_amount;
    groups[monthKey].count += 1;
  });

  return Object.entries(groups)
    .map(([month, data]) => ({
      month: format(parseISO(month + '-01'), 'MMM yyyy'),
      total: data.total,
      count: data.count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

// Search and filter utilities
export const searchInvoices = (invoices: Invoice[], query: string): Invoice[] => {
  if (!query.trim()) return invoices;

  const lowercaseQuery = query.toLowerCase();

  return invoices.filter(invoice => {
    const invoiceData = invoice.invoice_data?.[0];
    if (!invoiceData) return false;

    return (
      invoiceData.invoice_number.toLowerCase().includes(lowercaseQuery) ||
      invoiceData.vendor_name.toLowerCase().includes(lowercaseQuery) ||
      invoice.original_filename.toLowerCase().includes(lowercaseQuery) ||
      (invoiceData.customer_name && invoiceData.customer_name.toLowerCase().includes(lowercaseQuery))
    );
  });
};

export const filterInvoicesByStatus = (invoices: Invoice[], status: string): Invoice[] => {
  if (status === 'all') return invoices;
  return invoices.filter(invoice => invoice.processing_status === status);
};

// Mobile-specific utilities
export const convertToBase64 = async (uri: string): Promise<string> => {
  // This would be implemented differently for React Native
  // For now, returning a placeholder
  return `data:image/jpeg;base64,placeholder`;
};

export const compressImage = (uri: string, quality = 0.8): Promise<string> => {
  // Image compression logic for mobile
  // Would use react-native-image-resizer or similar
  return Promise.resolve(uri);
};

// Confidence score utilities
export const getConfidenceLevel = (score: number): 'high' | 'medium' | 'low' => {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
};

export const getConfidenceColor = (score: number): string => {
  const level = getConfidenceLevel(score);
  switch (level) {
    case 'high': return '#10B981'; // green
    case 'medium': return '#F59E0B'; // yellow
    case 'low': return '#EF4444'; // red
    default: return '#6B7280'; // gray
  }
};

// Analytics utilities
export const processExpenseAnalysis = (invoices: Invoice[]): ExpenseAnalysis => {
  const validInvoices = invoices.filter(inv => inv.invoice_data?.[0]);
  const totalExpenses = calculateTotalAmount(validInvoices);
  const totalInvoices = validInvoices.length;
  const averageAmount = totalInvoices > 0 ? totalExpenses / totalInvoices : 0;
  const currency = validInvoices[0]?.invoice_data?.[0]?.currency || 'USD';

  // Monthly data
  const monthlyData = groupInvoicesByMonth(validInvoices);

  // Top vendors
  const vendorGroups: { [key: string]: { total: number; count: number } } = {};
  validInvoices.forEach(invoice => {
    const data = invoice.invoice_data?.[0];
    if (!data) return;

    const vendor = data.vendor_name;
    if (!vendorGroups[vendor]) {
      vendorGroups[vendor] = { total: 0, count: 0 };
    }
    vendorGroups[vendor].total += data.total_amount;
    vendorGroups[vendor].count += 1;
  });

  const topVendors = Object.entries(vendorGroups)
    .map(([vendor_name, data]) => ({
      vendor_name,
      total: data.total,
      count: data.count
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Expenses by project (placeholder - would need project data)
  const expensesByProject = []; // Would be populated with actual project data

  // Recent invoices
  const recentInvoices = validInvoices
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return {
    totalExpenses,
    totalInvoices,
    averageAmount,
    currency,
    monthlyData,
    topVendors,
    expensesByProject,
    recentInvoices
  };
};