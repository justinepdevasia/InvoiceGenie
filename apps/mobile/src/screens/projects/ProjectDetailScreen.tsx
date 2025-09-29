import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

const ProjectDetailScreen = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const { projectId } = route.params || {};
  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  useEffect(() => {
    if (project) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={handleDeleteProject}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        ),
      });
    }
  }, [project, navigation]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);

      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Project fetch error:', projectError);
        throw projectError;
      }
      setProject(projectData);

      // Fetch invoices for this project with invoice_data joined
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_data (*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (invoicesError) {
        console.error('Invoices fetch error:', invoicesError);
        // Don't throw error if invoices table doesn't exist, just set empty array
        setDocuments([]);
      } else {
        setDocuments(invoicesData || []);
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      Alert.alert('Error', 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    const documentCount = documents.length;

    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete this project?${documentCount > 0 ? `\n\nThis will also delete ${documentCount} associated document${documentCount > 1 ? 's' : ''}.` : ''}\n\nThis action cannot be undone.`,
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
              // Delete all storage files for documents in this project
              if (documents.length > 0) {
                const filePaths = documents
                  .map(doc => doc.file_path)
                  .filter(path => path);

                if (filePaths.length > 0) {
                  const { error: storageError } = await supabase.storage
                    .from('documents')
                    .remove(filePaths);

                  if (storageError) {
                    console.error('Error deleting files from storage:', storageError);
                  }
                }
              }

              // Delete project (invoices and invoice_data will be deleted automatically via CASCADE)
              const { error: deleteError } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId);

              if (deleteError) throw deleteError;

              Alert.alert('Success', 'Project deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
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
    header: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: 4,
    },
    description: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.sm,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.lg,
      marginTop: theme.spacing.xs,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
    },
    scanButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    scanButtonText: {
      color: theme.colors.primary,
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
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
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
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
    emptyText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xl,
    },
    addButton: {
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      gap: theme.spacing.sm,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
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

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }}>Project not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Project Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{project.name}</Text>
        {project.description && (
          <Text style={styles.description}>{project.description}</Text>
        )}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{documents.length}</Text>
            <Text style={styles.statLabel}>documents</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {documents.filter((d) => d.processing_status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>completed</Text>
          </View>
        </View>
      </View>

      {/* Documents Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Documents</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Camera', { projectId: project.id })}
        >
          <Ionicons name="camera" size={18} color={theme.colors.primary} />
          <Text style={styles.scanButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Documents List */}
      {documents.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="document-text-outline"
              size={32}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.emptyText}>No documents yet</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('Camera', { projectId: project.id })}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Scan Document</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView>
          {documents.map((doc) => {
            const vendorName = doc.invoice_data?.[0]?.vendor_name || doc.invoice_data?.vendor_name || doc.vendor_name;
            const fileName = doc.original_file_name || doc.original_filename;

            return (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentItem}
                onPress={() =>
                  navigation.navigate('DocumentDetail', { documentId: doc.id })
                }
              >
                <View style={styles.documentLeft}>
                  <Text style={styles.documentName} numberOfLines={1}>
                    {vendorName || fileName || 'Untitled Document'}
                  </Text>
                  <Text style={styles.documentMeta}>
                    {fileName}
                  </Text>
                  <Text style={styles.documentDate}>
                    {new Date(doc.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ProjectDetailScreen;