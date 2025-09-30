import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type {
  ExpenseAnalysis,
  MonthlyExpenseData,
  VendorExpense,
  ProjectExpense
} from '@expensa/shared-types';

export const useAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ExpenseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all invoice data for analytics
      const { data: invoicesData, error: invoicesError } = await supabase
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
        .eq('processing_status', 'completed');

      if (invoicesError) throw invoicesError;

      if (!invoicesData || invoicesData.length === 0) {
        setAnalytics({
          totalExpenses: 0,
          totalInvoices: 0,
          averageAmount: 0,
          currency: 'USD',
          monthlyData: [],
          topVendors: [],
          expensesByProject: [],
          recentInvoices: [],
        });
        return;
      }

      // Calculate total expenses and stats
      let totalExpenses = 0;
      let currency = 'USD';
      const monthlyMap = new Map<string, { total: number; count: number }>();
      const vendorMap = new Map<string, { total: number; count: number }>();
      const projectMap = new Map<string, { total: number; count: number; name: string }>();

      invoicesData.forEach(invoice => {
        const invoiceData = invoice.invoice_data?.[0]; // Get first invoice data
        if (!invoiceData) return;

        const amount = invoiceData.total_amount || 0;
        totalExpenses += amount;
        currency = invoiceData.currency || 'USD';

        // Monthly data
        const date = new Date(invoice.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { total: 0, count: 0 });
        }
        const monthData = monthlyMap.get(monthKey)!;
        monthData.total += amount;
        monthData.count += 1;

        // Vendor data
        const vendorName = invoiceData.vendor_name || 'Unknown Vendor';
        if (!vendorMap.has(vendorName)) {
          vendorMap.set(vendorName, { total: 0, count: 0 });
        }
        const vendorData = vendorMap.get(vendorName)!;
        vendorData.total += amount;
        vendorData.count += 1;

        // Project data
        const projectName = invoice.projects?.name || 'No Project';
        const projectId = invoice.project_id || 'no-project';
        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, { total: 0, count: 0, name: projectName });
        }
        const projectData = projectMap.get(projectId)!;
        projectData.total += amount;
        projectData.count += 1;
      });

      // Sort and format data
      const monthlyData: MonthlyExpenseData[] = Array.from(monthlyMap.entries())
        .map(([monthKey, data]) => ({
          month: monthKey,
          total: data.total,
          count: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const topVendors: VendorExpense[] = Array.from(vendorMap.entries())
        .map(([vendor_name, data]) => ({
          vendor_name,
          total: data.total,
          count: data.count,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      const expensesByProject: ProjectExpense[] = Array.from(projectMap.entries())
        .map(([_, data]) => ({
          project_name: data.name,
          total: data.total,
          count: data.count,
        }))
        .sort((a, b) => b.total - a.total);

      const recentInvoices = invoicesData
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setAnalytics({
        totalExpenses,
        totalInvoices: invoicesData.length,
        averageAmount: invoicesData.length > 0 ? totalExpenses / invoicesData.length : 0,
        currency,
        monthlyData,
        topVendors,
        expensesByProject,
        recentInvoices,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
  };
};