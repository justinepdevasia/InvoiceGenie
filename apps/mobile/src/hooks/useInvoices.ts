import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Invoice, InvoiceData } from '@expensa/shared-types';

export const useInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('invoices')
        .select(`
          *,
          projects (
            id,
            name
          ),
          invoice_data (
            *
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      console.log('Fetched invoices:', data?.length || 0);
      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          projects (
            id,
            name
          ),
          invoice_data (
            *,
            invoice_line_items (*)
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching invoice:', err);
      return null;
    }
  };

  const createInvoice = async (invoiceData: {
    project_id?: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  }): Promise<Invoice | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          ...invoiceData,
          processing_status: invoiceData.processing_status || 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh invoices list
      fetchInvoices();

      return data;
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
      return null;
    }
  };

  const updateInvoiceStatus = async (
    invoiceId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ processing_status: status })
        .eq('id', invoiceId);

      if (error) throw error;

      // Refresh invoices list
      fetchInvoices();
    } catch (err) {
      console.error('Error updating invoice status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update invoice');
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoiceStatus,
  };
};