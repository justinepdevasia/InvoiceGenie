import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const DashboardScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch latest data
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const QuickStatsCard = ({ title, value, icon }: any) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.cardIcon, { color: theme.colors.primary }]}>
        {icon}
      </Text>
      <Text style={[styles.cardTitle, { color: theme.colors.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.cardValue, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );

  const ActionButton = ({ title, icon, onPress }: any) => (
    <TouchableOpacity
      style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
      onPress={onPress}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background,
    },
    greeting: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.textSecondary,
    },
    email: {
      fontSize: theme.fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: theme.spacing.xs,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    card: {
      flex: 1,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.xs,
      alignItems: 'center',
    },
    cardIcon: {
      fontSize: 24,
      marginBottom: theme.spacing.sm,
    },
    cardTitle: {
      fontSize: theme.fontSize.sm,
      marginBottom: theme.spacing.xs,
    },
    cardValue: {
      fontSize: theme.fontSize.lg,
      fontWeight: 'bold',
    },
    actionsContainer: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: theme.spacing.sm,
    },
    actionIcon: {
      fontSize: 20,
      marginRight: theme.spacing.md,
    },
    actionText: {
      fontSize: theme.fontSize.md,
      color: 'white',
      fontWeight: '600',
    },
    recentContainer: {
      paddingHorizontal: theme.spacing.lg,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyIcon: {
      fontSize: 48,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    emptyText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    signOutButton: {
      margin: theme.spacing.lg,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.error,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
    },
    signOutText: {
      color: 'white',
      fontSize: theme.fontSize.md,
      fontWeight: '600',
    },
  });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <QuickStatsCard title="Total Expenses" value="$0" icon="💰" />
        <QuickStatsCard title="Documents" value="0" icon="📄" />
        <QuickStatsCard title="Projects" value="0" icon="📁" />
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <ActionButton
          title="Scan Document"
          icon="📷"
          onPress={() => navigation.navigate('Camera')}
        />

        <ActionButton
          title="View Projects"
          icon="📁"
          onPress={() => navigation.navigate('Projects')}
        />

        <ActionButton
          title="View Documents"
          icon="📄"
          onPress={() => navigation.navigate('Documents')}
        />

        <ActionButton
          title="View Analytics"
          icon="📈"
          onPress={() => navigation.navigate('Analysis')}
        />
      </View>

      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>
            No recent activity.{'\n'}Start by scanning your first document!
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DashboardScreen;