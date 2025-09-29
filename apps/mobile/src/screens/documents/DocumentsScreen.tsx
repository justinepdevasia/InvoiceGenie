import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useInvoices } from '../../hooks/useInvoices';
import { useProjects } from '../../hooks/useProjects';

const DocumentsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [refreshing, setRefreshing] = useState(false);

  const { invoices, loading, fetchInvoices } = useInvoices();
  const { projects } = useProjects();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchInvoices();
    setRefreshing(false);
  }, [fetchInvoices]);

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter((invoice) => {
      const vendorName = invoice.invoice_data?.[0]?.vendor_name || invoice.invoice_data?.vendor_name || invoice.vendor_name || '';
      const matchesSearch =
        vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.original_filename?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = !selectedProject || invoice.project_id === selectedProject;
      return matchesSearch && matchesProject;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      const amountA = a.invoice_data?.[0]?.total_amount || a.invoice_data?.total_amount || a.amount || 0;
      const amountB = b.invoice_data?.[0]?.total_amount || b.invoice_data?.total_amount || b.amount || 0;
      return amountB - amountA;
    });

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    searchInput: {
      flex: 1,
      height: 40,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
    },
    filterButton: {
      padding: theme.spacing.sm,
    },
    filterPanel: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.sm,
    },
    filterLabel: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    filterOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    filterChip: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.text,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    list: {
      flex: 1,
    },
    documentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    documentLeft: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    documentName: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    documentMeta: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    documentDate: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    documentRight: {
      alignItems: 'flex-end',
    },
    documentAmount: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    documentStatus: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.primary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.xxl * 2,
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

  const renderDocumentItem = ({ item }: any) => {
    // Try to get amount from invoice_data first, then fall back to invoice.amount
    const amount = item.invoice_data?.[0]?.total_amount || item.invoice_data?.total_amount || item.amount || 0;
    const vendorName = item.invoice_data?.[0]?.vendor_name || item.invoice_data?.vendor_name || item.vendor_name;
    const fileName = item.original_file_name || item.original_filename;

    return (
      <TouchableOpacity
        style={styles.documentItem}
        onPress={() => navigation.navigate('DocumentDetail', { documentId: item.id })}
      >
        <View style={styles.documentLeft}>
          <Text style={styles.documentName} numberOfLines={1}>
            {vendorName || fileName || 'Untitled Document'}
          </Text>
          {fileName && vendorName && (
            <Text style={styles.documentMeta} numberOfLines={1}>{fileName}</Text>
          )}
          <Text style={styles.documentDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.documentRight}>
          <Text style={styles.documentAmount}>{formatCurrency(amount)}</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons
            name={showFilters ? 'close' : 'options'}
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    sortBy === 'date' && styles.filterChipActive,
                  ]}
                  onPress={() => setSortBy('date')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortBy === 'date' && styles.filterChipTextActive,
                    ]}
                  >
                    Date
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    sortBy === 'amount' && styles.filterChipActive,
                  ]}
                  onPress={() => setSortBy('amount')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      sortBy === 'amount' && styles.filterChipTextActive,
                    ]}
                  >
                    Amount
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View>
            <Text style={styles.filterLabel}>Project</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedProject && styles.filterChipActive,
                ]}
                onPress={() => setSelectedProject(null)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    !selectedProject && styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.filterChip,
                    selectedProject === project.id && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedProject(project.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedProject === project.id && styles.filterChipTextActive,
                    ]}
                  >
                    {project.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Documents List */}
      {loading && invoices.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="sync" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Loading Documents...</Text>
        </View>
      ) : filteredInvoices.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-outline" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Documents Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery || selectedProject
              ? 'Try adjusting your filters'
              : 'Scan your first document to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default DocumentsScreen;