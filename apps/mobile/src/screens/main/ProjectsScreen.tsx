import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const ProjectsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyIcon, { color: theme.colors.textSecondary }]}>
        📁
      </Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No projects yet
      </Text>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        Create your first project to start organizing your expenses
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => {
          // TODO: Navigate to create project screen
        }}
      >
        <Text style={styles.createButtonText}>Create Project</Text>
      </TouchableOpacity>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
      fontSize: theme.fontSize.xl,
      fontWeight: 'bold',
      marginBottom: theme.spacing.sm,
    },
    emptyText: {
      fontSize: theme.fontSize.md,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: theme.spacing.xl,
    },
    createButton: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    createButtonText: {
      color: 'white',
      fontSize: theme.fontSize.md,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={[]} // TODO: Replace with actual project data
        renderItem={() => null}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
  );
};

export default ProjectsScreen;