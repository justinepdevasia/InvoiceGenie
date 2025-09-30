import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProjects } from '../../hooks/useProjects';
import { useInvoices } from '../../hooks/useInvoices';
import { useAnalytics } from '../../hooks/useAnalytics';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  // Use real data hooks
  const { projects, loading: projectsLoading, fetchProjects } = useProjects();
  const { invoices, loading: invoicesLoading, fetchInvoices } = useInvoices();
  const { analytics, loading: analyticsLoading, fetchAnalytics } = useAnalytics();

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProjects(),
      fetchInvoices(),
      fetchAnalytics(),
    ]);
    setRefreshing(false);
  }, [fetchProjects, fetchInvoices, fetchAnalytics]);

  // Calculate real stats
  const stats = React.useMemo(() => {
    const pendingInvoices = invoices.filter(
      (invoice) => invoice.processing_status === 'pending' ||
      invoice.processing_status === 'processing'
    ).length;

    return {
      totalProjects: projects.length,
      pendingInvoices,
      totalRevenue: analytics?.totalExpenses || 0,
      thisMonthRevenue: analytics?.monthlyData?.[analytics.monthlyData.length - 1]?.total || 0,
    };
  }, [projects, invoices, analytics]);

  // Generate recent activity from real data
  const recentActivity = React.useMemo(() => {
    const activities: any[] = [];

    // Add recent invoices
    const recentInvoices = invoices
      .slice(0, 3)
      .map((invoice) => ({
        id: invoice.id,
        type: 'invoice_created',
        title: 'Invoice processed',
        description: `${invoice.original_filename} - ${invoice.processing_status}`,
        time: new Date(invoice.created_at).toLocaleDateString(),
        icon: 'receipt-outline',
      }));

    // Add recent projects
    const recentProjects = projects
      .slice(0, 2)
      .map((project) => ({
        id: project.id,
        type: 'project_created',
        title: 'Project created',
        description: `${project.name} - ${project.invoice_count || 0} invoices`,
        time: new Date(project.created_at).toLocaleDateString(),
        icon: 'folder-outline',
      }));

    activities.push(...recentInvoices, ...recentProjects);

    // Sort by created date and take top 5
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [invoices, projects]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientHeader: {
      height: 100,
      position: 'relative',
    },
    headerContent: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    logoText: {
      fontSize: theme.fontSize.xxl,
      fontWeight: theme.fontWeight.bold,
      color: '#FFFFFF',
      letterSpacing: -0.5,
    },
    greeting: {
      fontSize: theme.fontSize.lg,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: theme.fontWeight.medium,
    },
    userName: {
      fontSize: theme.fontSize.xxxl,
      color: '#FFFFFF',
      fontWeight: theme.fontWeight.bold,
      marginTop: theme.spacing.xs,
    },
    headerActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    quickAction: {
      alignItems: 'center',
      flex: 1,
    },
    quickActionIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    quickActionText: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
      textAlign: 'center',
    },
    scrollContainer: {
      flex: 1,
      marginTop: -20,
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    statCard: {
      flex: 1,
      minWidth: (width - theme.spacing.lg * 3) / 2,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      ...theme.shadows.md,
    },
    statValue: {
      fontSize: theme.fontSize.xxl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.xs,
    },
    statLabel: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      fontWeight: theme.fontWeight.medium,
    },
    sectionTitle: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    activityIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    activityContent: {
      flex: 1,
    },
    activityTitle: {
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    activityDescription: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    activityTime: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textTertiary,
    },
    floatingAction: {
      position: 'absolute',
      bottom: theme.spacing.xl,
      right: theme.spacing.lg,
      ...theme.shadows.lg,
    },
    fab: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="document-text" size={40} color="#FFFFFF" />
            <Text style={styles.logoText}>InvoiceGenie</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalProjects}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{invoices.length}</Text>
            <Text style={styles.statLabel}>Total Documents</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <Card style={{ marginBottom: theme.spacing.xxl }}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.activityItem,
                {
                  borderBottomWidth:
                    index === recentActivity.length - 1 ? 0 : 1,
                },
              ]}
            >
              <View style={styles.activityIcon}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{item.title}</Text>
                <Text style={styles.activityDescription}>
                  {item.description}
                </Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.floatingAction}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Camera')}
          style={styles.fab}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
          <Ionicons name="camera" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DashboardScreen;