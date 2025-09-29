import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

const DocumentDetailScreen = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const { documentId } = route.params || {};
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (documentId) {
      fetchInvoiceDetails();
    }
  }, [documentId]);

  useEffect(() => {
    if (invoice) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={handleDelete}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        ),
      });
    }
  }, [invoice, navigation]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);

      // Fetch invoice basic info
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', documentId)
        .single();

      if (invoiceError) throw invoiceError;

      // Fetch invoice extracted data
      const { data: extractedData, error: dataError } = await supabase
        .from('invoice_data')
        .select('*')
        .eq('invoice_id', documentId)
        .maybeSingle();

      // Combine both datasets
      const combinedData = {
        ...invoiceData,
        ...extractedData,
        // Get file URL from storage
        image_url: invoiceData?.file_path ? await getSignedUrl(invoiceData.file_path) : null
      };

      setInvoice(combinedData);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      Alert.alert('Error', 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const getSignedUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from storage first
              if (invoice.file_path) {
                const { error: storageError } = await supabase.storage
                  .from('documents')
                  .remove([invoice.file_path]);

                if (storageError) {
                  console.error('Error deleting file from storage:', storageError);
                }
              }

              // Delete invoice record (invoice_data will be deleted automatically via CASCADE)
              const { error: deleteError } = await supabase
                .from('invoices')
                .delete()
                .eq('id', documentId);

              if (deleteError) throw deleteError;

              Alert.alert('Success', 'Document deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Error deleting document:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
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
    content: {
      padding: theme.spacing.lg,
    },
    header: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    invoiceNumber: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      marginTop: theme.spacing.sm,
    },
    statusText: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: '#FFFFFF',
    },
    section: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    label: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },
    value: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.text,
      textAlign: 'right',
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      marginTop: theme.spacing.sm,
    },
    totalLabel: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
    },
    totalValue: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.primary,
    },
    viewDocumentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    viewDocumentText: {
      flex: 1,
      marginLeft: theme.spacing.md,
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.primary,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: '#000000',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    closeButton: {
      position: 'absolute',
      left: theme.spacing.md,
      padding: theme.spacing.xs,
    },
    openExternalButton: {
      position: 'absolute',
      right: theme.spacing.md,
      padding: theme.spacing.xs,
    },
    modalTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: '#FFFFFF',
    },
    modalContent: {
      flex: 1,
    },
    modalContentContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullscreenImage: {
      width: width,
      height: height - 100,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xxl,
    },
    emptyText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.md,
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

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={60}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>Invoice not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'processed':
        return '#10B981';
      case 'processing':
      case 'pending':
        return '#F59E0B';
      case 'failed':
        return '#EF4444';
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.invoiceNumber}>
              {String(invoice.invoice_number || 'No Invoice Number')}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(invoice.processing_status || invoice.status || 'pending') },
              ]}
            >
              <Text style={styles.statusText}>
                {String(invoice.processing_status || invoice.status || 'pending').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* View Document Button */}
          {invoice.image_url && (
            <TouchableOpacity
              style={styles.viewDocumentButton}
              onPress={() => setShowImageModal(true)}
            >
              <Ionicons name="document-text" size={20} color={theme.colors.primary} />
              <Text style={styles.viewDocumentText}>
                View Original Document
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Vendor Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vendor Information</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Vendor Name</Text>
              <Text style={styles.value}>
                {String(invoice.vendor_name || 'N/A')}
              </Text>
            </View>
            {invoice.vendor_address && (
              <View style={styles.row}>
                <Text style={styles.label}>Address</Text>
                <Text style={styles.value}>{String(invoice.vendor_address)}</Text>
              </View>
            )}
          </View>

          {/* Invoice Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Invoice Date</Text>
              <Text style={styles.value}>
                {invoice.invoice_date
                  ? new Date(invoice.invoice_date).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Due Date</Text>
              <Text style={styles.value}>
                {invoice.due_date
                  ? new Date(invoice.due_date).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
            {invoice.po_number && (
              <View style={styles.row}>
                <Text style={styles.label}>PO Number</Text>
                <Text style={styles.value}>{String(invoice.po_number)}</Text>
              </View>
            )}
          </View>

          {/* Amount Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            {invoice.subtotal != null && invoice.subtotal > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Subtotal</Text>
                <Text style={styles.value}>
                  {formatCurrency(Number(invoice.subtotal))}
                </Text>
              </View>
            )}
            {invoice.tax_amount != null && invoice.tax_amount > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Tax</Text>
                <Text style={styles.value}>{formatCurrency(Number(invoice.tax_amount))}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(Number(invoice.total_amount || invoice.amount || 0))}
              </Text>
            </View>
          </View>

          {/* Additional Information */}
          {invoice.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.value}>{String(invoice.notes)}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fullscreen Document Modal */}
      <Modal
        visible={showImageModal}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowImageModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowImageModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Document</Text>
            <TouchableOpacity
              onPress={() => {
                if (invoice?.image_url) {
                  Linking.openURL(invoice.image_url);
                }
              }}
              style={styles.openExternalButton}
            >
              <Ionicons name="open-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {invoice?.file_type === 'application/pdf' ? (
            <WebView
              source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(invoice?.image_url)}` }}
              style={styles.fullscreenImage}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.text, marginTop: 10 }}>Loading PDF...</Text>
                </View>
              )}
            />
          ) : invoice?.file_type?.startsWith('image/') ? (
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              maximumZoomScale={3}
              minimumZoomScale={1}
            >
              <Image
                source={{ uri: invoice?.image_url }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </ScrollView>
          ) : (
            <WebView
              source={{ uri: invoice?.image_url }}
              style={styles.fullscreenImage}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error:', nativeEvent);
                Alert.alert('Error', 'Failed to load document. Try opening it externally.');
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Loading document...</Text>
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default DocumentDetailScreen;