import { createClient } from '@supabase/supabase-js';
import type {
  User,
  Project,
  Invoice,
  InvoiceData,
  ApiResponse,
  OCRProcessingResponse,
  UsageResponse,
  CreateProjectForm,
  LoginForm,
  RegisterForm,
  ExpenseAnalysis
} from '@expensa/shared-types';

// Environment variables - these would be different for mobile
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.EXPO_PUBLIC_API_URL || '';

// Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth API
export const authAPI = {
  signIn: async ({ email, password }: LoginForm) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signUp: async ({ email, password }: RegisterForm) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  }
};

// Projects API
export const projectsAPI = {
  getAll: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        invoice_count:invoices(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getById: async (id: string): Promise<Project | null> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (project: CreateProjectForm): Promise<Project> => {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Invoices API
export const invoicesAPI = {
  getAll: async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        projects(*),
        invoice_data(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getByProject: async (projectId: string): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        projects(*),
        invoice_data(*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getById: async (id: string): Promise<Invoice | null> => {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        projects(*),
        invoice_data(
          *,
          invoice_line_items(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  create: async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Promise<Invoice> => {
    const { data, error } = await supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateStatus: async (id: string, status: Invoice['processing_status']): Promise<void> => {
    const { error } = await supabase
      .from('invoices')
      .update({ processing_status: status })
      .eq('id', id);

    if (error) throw error;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// OCR API
export const ocrAPI = {
  processDocument: async (
    invoiceId: string,
    base64Data: string,
    fileType: string,
    fileName: string
  ): Promise<OCRProcessingResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/ocr/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId,
        base64Data,
        fileType,
        fileName
      })
    });

    const data = await response.json();
    return data;
  },

  checkUsage: async (): Promise<UsageResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/usage/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    return data;
  }
};

// Analytics API
export const analyticsAPI = {
  getExpenseAnalysis: async (): Promise<ExpenseAnalysis> => {
    // This would typically be a server-side aggregation
    // For now, we'll fetch invoices and process client-side
    const invoices = await invoicesAPI.getAll();

    // Process analytics (this could be moved to server-side for better performance)
    const validInvoices = invoices.filter(inv => inv.invoice_data?.[0]);
    const totalExpenses = validInvoices.reduce((sum, inv) => sum + (inv.invoice_data?.[0]?.total_amount || 0), 0);
    const totalInvoices = validInvoices.length;
    const averageAmount = totalInvoices > 0 ? totalExpenses / totalInvoices : 0;
    const currency = validInvoices[0]?.invoice_data?.[0]?.currency || 'USD';

    // Monthly data processing
    const monthlyGroups: { [key: string]: { total: number; count: number } } = {};
    validInvoices.forEach(invoice => {
      const data = invoice.invoice_data?.[0];
      if (!data) return;

      const date = new Date(data.invoice_date || invoice.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = { total: 0, count: 0 };
      }

      monthlyGroups[monthKey].total += data.total_amount;
      monthlyGroups[monthKey].count += 1;
    });

    const monthlyData = Object.entries(monthlyGroups).map(([month, data]) => ({
      month,
      total: data.total,
      count: data.count
    }));

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
      expensesByProject: [], // Would implement project-specific analytics
      recentInvoices
    };
  }
};

// Storage API (for file uploads)
export const storageAPI = {
  uploadFile: async (file: File | string, path: string): Promise<{ path: string; error?: any }> => {
    // For mobile, file would be base64 string or local URI
    // This is a simplified version - would need platform-specific implementation

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file);

    return { path: data?.path || '', error };
  },

  deleteFile: async (path: string): Promise<{ error?: any }> => {
    const { error } = await supabase.storage
      .from('documents')
      .remove([path]);

    return { error };
  },

  getPublicUrl: (path: string): string => {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(path);

    return data.publicUrl;
  }
};

// Export the supabase client for direct use if needed
export { supabase };

// Export all APIs
export const api = {
  auth: authAPI,
  projects: projectsAPI,
  invoices: invoicesAPI,
  ocr: ocrAPI,
  analytics: analyticsAPI,
  storage: storageAPI
};