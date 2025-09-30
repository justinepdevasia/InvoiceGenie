import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import { format, subMonths, parseISO, isValid } from 'date-fns';

interface InvoiceData {
  id: string;
  invoice_id: string;
  invoice_number: string;
  vendor_name: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  currency: string;
  invoice_date: string;
  payment_method?: string;
  raw_ocr_data: any;
  project_name?: string;
  project_id: string;
}

interface SpendingTrend {
  month: string;
  amount: number;
  count: number;
}

interface VendorAnalysis {
  vendor: string;
  total: number;
  count: number;
  average: number;
  percentage: number;
}

interface CategoryAnalysis {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

const { width } = Dimensions.get('window');
const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#EC4899', '#06B6D4'];

const AnalysisScreen = () => {
  const { theme } = useTheme();
  const [invoiceData, setInvoiceData] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'vendors' | 'categories'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch invoice data with projects
      const { data: invoicesData, error } = await supabase
        .from('invoices')
        .select(`
          id,
          project_id,
          processing_status,
          projects!inner(name),
          invoice_data(
            id,
            invoice_number,
            vendor_name,
            total_amount,
            subtotal,
            tax_amount,
            currency,
            invoice_date,
            raw_ocr_data
          )
        `)
        .eq('user_id', user.id);

      if (invoicesData && invoicesData.length > 0) {
        const transformedData: InvoiceData[] = invoicesData
          .filter(inv => {
            return inv.processing_status === 'completed' &&
                   inv.invoice_data &&
                   (Array.isArray(inv.invoice_data) ? inv.invoice_data.length > 0 : inv.invoice_data) &&
                   inv.projects;
          })
          .map(inv => {
            const invoiceData = Array.isArray(inv.invoice_data) ? inv.invoice_data[0] : inv.invoice_data;
            const projectData = Array.isArray(inv.projects) ? inv.projects[0] : inv.projects;
            return {
              id: invoiceData?.id || inv.id,
              invoice_id: inv.id,
              invoice_number: invoiceData?.invoice_number || '',
              vendor_name: invoiceData?.vendor_name || 'Unknown',
              total_amount: Number(invoiceData?.total_amount) || 0,
              subtotal: Number(invoiceData?.subtotal) || 0,
              tax_amount: Number(invoiceData?.tax_amount) || 0,
              currency: invoiceData?.currency || 'USD',
              invoice_date: invoiceData?.invoice_date || '',
              payment_method: invoiceData?.raw_ocr_data?.payment_method || 'Unknown',
              raw_ocr_data: invoiceData?.raw_ocr_data || {},
              project_name: projectData?.name || 'Unknown Project',
              project_id: inv.project_id
            };
          });

        setInvoiceData(transformedData);
      } else {
        setInvoiceData([]);
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  // Calculate spending trends
  const spendingTrends = useMemo(() => {
    const trends: Record<string, SpendingTrend> = {};

    invoiceData.forEach(item => {
      if (item.invoice_date) {
        const date = parseISO(item.invoice_date);
        if (isValid(date)) {
          const monthKey = format(date, 'yyyy-MM');
          const monthLabel = format(date, 'MMM yy');

          if (!trends[monthKey]) {
            trends[monthKey] = {
              month: monthLabel,
              amount: 0,
              count: 0
            };
          }

          trends[monthKey].amount += item.total_amount;
          trends[monthKey].count += 1;
        }
      }
    });

    return Object.values(trends).sort((a, b) => a.month.localeCompare(b.month));
  }, [invoiceData]);

  // Calculate vendor analysis
  const vendorAnalysis = useMemo(() => {
    const vendors: Record<string, VendorAnalysis> = {};
    const totalSpending = invoiceData.reduce((sum, item) => sum + item.total_amount, 0);

    invoiceData.forEach(item => {
      const vendor = item.vendor_name || 'Unknown';

      if (!vendors[vendor]) {
        vendors[vendor] = {
          vendor,
          total: 0,
          count: 0,
          average: 0,
          percentage: 0
        };
      }

      vendors[vendor].total += item.total_amount;
      vendors[vendor].count += 1;
    });

    return Object.values(vendors)
      .map(vendor => ({
        ...vendor,
        average: vendor.total / vendor.count,
        percentage: totalSpending > 0 ? (vendor.total / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [invoiceData]);

  // Auto-categorize expenses
  const categoryAnalysis = useMemo(() => {
    const categories: Record<string, CategoryAnalysis> = {};
    const totalSpending = invoiceData.reduce((sum, item) => sum + item.total_amount, 0);

    invoiceData.forEach(item => {
      let category = 'Other';
      const vendor = item.vendor_name?.toLowerCase() || '';
      const description = item.raw_ocr_data?.line_items?.[0]?.description?.toLowerCase() || '';

      if (vendor.includes('aws') || vendor.includes('google') || vendor.includes('microsoft') || vendor.includes('supabase')) {
        category = 'Technology & Software';
      } else if (vendor.includes('home depot') || vendor.includes('lowes') || description.includes('concrete')) {
        category = 'Hardware & Materials';
      } else if (vendor.includes('office') || description.includes('office')) {
        category = 'Office Supplies';
      } else if (vendor.includes('travel') || vendor.includes('hotel') || vendor.includes('airline')) {
        category = 'Travel & Transportation';
      } else if (vendor.includes('restaurant') || vendor.includes('food')) {
        category = 'Meals & Entertainment';
      } else if (description.includes('subscription') || description.includes('plan')) {
        category = 'Subscriptions & Services';
      }

      if (!categories[category]) {
        categories[category] = {
          category,
          total: 0,
          count: 0,
          percentage: 0
        };
      }

      categories[category].total += item.total_amount;
      categories[category].count += 1;
    });

    return Object.values(categories)
      .map(cat => ({
        ...cat,
        percentage: totalSpending > 0 ? (cat.total / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [invoiceData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = invoiceData.reduce((sum, item) => sum + item.total_amount, 0);
    const count = invoiceData.length;
    const average = count > 0 ? total / count : 0;
    const taxTotal = invoiceData.reduce((sum, item) => sum + (item.tax_amount || 0), 0);

    const currentMonth = spendingTrends[spendingTrends.length - 1]?.amount || 0;
    const previousMonth = spendingTrends[spendingTrends.length - 2]?.amount || 0;
    const growth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

    return {
      totalSpending: total,
      transactionCount: count,
      averageTransaction: average,
      taxPaid: taxTotal,
      monthlyGrowth: growth,
      topVendor: vendorAnalysis[0]?.vendor || 'N/A'
    };
  }, [invoiceData, spendingTrends, vendorAnalysis]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    statCard: {
      width: (width - theme.spacing.md * 3) / 2,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statIcon: {
      marginBottom: theme.spacing.sm,
    },
    statValue: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    statGrowth: {
      fontSize: theme.fontSize.xs,
      marginTop: 4,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.sm,
      gap: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
    },
    section: {
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    chartContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    trendItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    trendMonth: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.text,
    },
    trendAmount: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.primary,
    },
    trendCount: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    vendorItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    vendorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    vendorName: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      flex: 1,
    },
    vendorTotal: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.primary,
    },
    vendorDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xs,
    },
    vendorMeta: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    progressBar: {
      height: 6,
      backgroundColor: `${theme.colors.primary}20`,
      borderRadius: theme.borderRadius.round,
      marginTop: theme.spacing.xs,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
    },
    categoryItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    categoryName: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      flex: 1,
    },
    categoryTotal: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.primary,
    },
    categoryMeta: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xxl,
    },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    emptyText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (invoiceData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analysis</Text>
          <Text style={styles.headerSubtitle}>No data available yet</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="analytics-outline" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Analysis Data</Text>
          <Text style={styles.emptyText}>
            Upload and process invoices to see spending insights and analytics
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analysis</Text>
        <Text style={styles.headerSubtitle}>Spending insights and trends</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Statistics */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={24} color={theme.colors.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>{formatCurrency(summaryStats.totalSpending)}</Text>
            <Text style={styles.statLabel}>Total Spending</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>{summaryStats.transactionCount}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="calculator-outline" size={24} color={theme.colors.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>{formatCurrency(summaryStats.averageTransaction)}</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name={summaryStats.monthlyGrowth >= 0 ? "trending-up" : "trending-down"}
              size={24}
              color={summaryStats.monthlyGrowth >= 0 ? '#10B981' : '#EF4444'}
              style={styles.statIcon}
            />
            <Text style={[
              styles.statValue,
              { color: summaryStats.monthlyGrowth >= 0 ? '#10B981' : '#EF4444' }
            ]}>
              {summaryStats.monthlyGrowth >= 0 ? '+' : ''}{summaryStats.monthlyGrowth.toFixed(1)}%
            </Text>
            <Text style={styles.statLabel}>Monthly Growth</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'overview' && styles.tabActive]}
            onPress={() => setSelectedTab('overview')}
          >
            <Text style={[styles.tabText, selectedTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'vendors' && styles.tabActive]}
            onPress={() => setSelectedTab('vendors')}
          >
            <Text style={[styles.tabText, selectedTab === 'vendors' && styles.tabTextActive]}>
              Vendors
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'categories' && styles.tabActive]}
            onPress={() => setSelectedTab('categories')}
          >
            <Text style={[styles.tabText, selectedTab === 'categories' && styles.tabTextActive]}>
              Categories
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {selectedTab === 'overview' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Trends</Text>
            <View style={styles.chartContainer}>
              {spendingTrends.slice(-6).map((trend, index) => (
                <View key={index} style={styles.trendItem}>
                  <View>
                    <Text style={styles.trendMonth}>{trend.month}</Text>
                    <Text style={styles.trendCount}>{trend.count} transactions</Text>
                  </View>
                  <Text style={styles.trendAmount}>{formatCurrency(trend.amount)}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Top Insights</Text>
            <View style={styles.chartContainer}>
              <View style={[styles.trendItem, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trendMonth}>Top Vendor</Text>
                  <Text style={styles.trendCount}>{summaryStats.topVendor}</Text>
                </View>
                <Ionicons name="business-outline" size={24} color={theme.colors.primary} />
              </View>
            </View>
            <View style={styles.chartContainer}>
              <View style={[styles.trendItem, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.trendMonth}>Total Tax Paid</Text>
                  <Text style={styles.trendAmount}>{formatCurrency(summaryStats.taxPaid)}</Text>
                </View>
                <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'vendors' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Vendors</Text>
            {vendorAnalysis.map((vendor, index) => (
              <View key={vendor.vendor} style={styles.vendorItem}>
                <View style={styles.vendorHeader}>
                  <Text style={styles.vendorName} numberOfLines={1}>{vendor.vendor}</Text>
                  <Text style={styles.vendorTotal}>{formatCurrency(vendor.total)}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${vendor.percentage}%` }]} />
                </View>
                <View style={styles.vendorDetails}>
                  <Text style={styles.vendorMeta}>{vendor.count} transactions</Text>
                  <Text style={styles.vendorMeta}>
                    Avg: {formatCurrency(vendor.average)}
                  </Text>
                  <Text style={styles.vendorMeta}>{vendor.percentage.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {selectedTab === 'categories' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expense Categories</Text>
            {categoryAnalysis.map((category, index) => (
              <View key={category.category} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryTotal}>{formatCurrency(category.total)}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${category.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }
                    ]}
                  />
                </View>
                <View style={styles.vendorDetails}>
                  <Text style={styles.categoryMeta}>{category.count} transactions</Text>
                  <Text style={styles.categoryMeta}>{category.percentage.toFixed(1)}% of total</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalysisScreen;