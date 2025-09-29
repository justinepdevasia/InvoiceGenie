import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useProjects } from '../../hooks/useProjects';

const ProjectsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    deleteProject
  } = useProjects();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }

    const newProject = await createProject({
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || undefined,
    });

    if (newProject) {
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateForm(false);
      Alert.alert('Success', 'Project created successfully!');
    } else {
      Alert.alert('Error', 'Failed to create project');
    }
  };

  const handleDeleteProject = (projectId: string, projectName: string) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${projectName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProject(projectId);
            if (success) {
              Alert.alert('Success', 'Project deleted successfully!');
            } else {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
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
    scrollContainer: {
      flex: 1,
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
      lineHeight: 22,
      marginBottom: theme.spacing.xl,
    },
    projectCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    projectHeader: {
      flex: 1,
      marginRight: theme.spacing.md,
    },
    projectInfo: {
      flex: 1,
    },
    projectName: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    projectDescription: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    projectStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
    },
    projectActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.colors.textSecondary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createForm: {
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.lg,
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md,
    },
    createFormTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.lg,
    },
    createFormActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    createdDate: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textTertiary,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Button
          title="New"
          onPress={() => setShowCreateForm(true)}
          variant="primary"
          size="sm"
          icon="add"
        />
      </View>

      {/* Create Form */}
      {showCreateForm && (
        <View style={styles.createForm}>
          <Text style={styles.createFormTitle}>Create New Project</Text>

          <Input
            placeholder="Project name"
            value={newProjectName}
            onChangeText={setNewProjectName}
            style={{ marginBottom: theme.spacing.md }}
          />

          <Input
            placeholder="Description (optional)"
            value={newProjectDescription}
            onChangeText={setNewProjectDescription}
            multiline
            numberOfLines={3}
            style={{ marginBottom: theme.spacing.md }}
          />

          <View style={styles.createFormActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setShowCreateForm(false);
                setNewProjectName('');
                setNewProjectDescription('');
              }}
              variant="ghost"
              style={{ flex: 1 }}
            />
            <Button
              title="Create"
              onPress={handleCreateProject}
              variant="primary"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && projects.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sync" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Loading Projects...</Text>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="folder-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Projects Found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No projects match your search criteria.'
                : 'Start by creating your first project to organize your invoices and documents.'}
            </Text>
            {!searchQuery && (
              <Button
                title="Create First Project"
                onPress={() => setShowCreateForm(true)}
                gradient
              />
            )}
          </View>
        ) : (
          filteredProjects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: project.id })}
            >
              <View style={styles.projectHeader}>
                <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                {project.description && (
                  <Text style={styles.projectDescription} numberOfLines={1}>{project.description}</Text>
                )}
                <View style={styles.projectStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{project.invoice_count || 0}</Text>
                    <Text style={styles.statLabel}>docs</Text>
                  </View>
                  <Text style={styles.createdDate}>
                    {new Date(project.updated_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.projectActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('Camera', { projectId: project.id });
                  }}
                >
                  <Ionicons name="camera" size={16} color={theme.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id, project.name);
                  }}
                >
                  <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
                </TouchableOpacity>

                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {error && (
        <View style={{ padding: theme.spacing.lg }}>
          <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ProjectsScreen;