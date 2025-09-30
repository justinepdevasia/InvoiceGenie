import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const { signIn } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    gradientBackground: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: height * 0.6,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxl,
      paddingTop: theme.spacing.xxl,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: theme.borderRadius.xl,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      ...theme.shadows.lg,
    },
    logoIcon: {
      marginBottom: 4,
    },
    title: {
      fontSize: theme.fontSize.xxxl,
      fontWeight: theme.fontWeight.bold,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.fontSize.lg,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      lineHeight: 24,
    },
    formCard: {
      marginTop: theme.spacing.xl,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      ...theme.shadows.lg,
    },
    formTitle: {
      fontSize: theme.fontSize.xxl,
      fontWeight: theme.fontWeight.bold,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    inputContainer: {
      marginBottom: theme.spacing.md,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xl,
    },
    forgotPasswordText: {
      color: theme.colors.primary,
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.medium,
    },
    signInButton: {
      marginBottom: theme.spacing.lg,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      marginHorizontal: theme.spacing.md,
      color: theme.colors.textSecondary,
      fontSize: theme.fontSize.sm,
    },
    signUpContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    signUpText: {
      color: theme.colors.textSecondary,
      fontSize: theme.fontSize.md,
    },
    signUpLink: {
      color: theme.colors.primary,
      fontSize: theme.fontSize.md,
      fontWeight: theme.fontWeight.semibold,
      marginLeft: theme.spacing.xs,
    },
    themeToggle: {
      position: 'absolute',
      top: 60,
      right: theme.spacing.lg,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    bottomDecoration: {
      position: 'absolute',
      bottom: -50,
      right: -50,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative elements */}
      <View style={styles.bottomDecoration} />

      {/* Theme toggle */}
      <View style={styles.themeToggle}>
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={24}
          color="white"
          onPress={toggleTheme}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons
                name="receipt"
                size={40}
                color="white"
                style={styles.logoIcon}
              />
            </View>
            <Text style={styles.title}>Expensa</Text>
            <Text style={styles.subtitle}>
              Smart expense management{'\n'}at your fingertips
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome back</Text>

            <View style={styles.inputContainer}>
              <Input
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon="mail-outline"
              />
            </View>

            <View style={styles.inputContainer}>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
            </View>

            <Button
              title="Sign In"
              onPress={handleSignIn}
              gradient
              loading={loading}
              disabled={loading}
              size="lg"
              style={styles.signInButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Sign In with Google"
              onPress={() => {
                // TODO: Implement Google Sign In
                Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
              }}
              variant="outline"
              icon="logo-google"
              size="lg"
            />

            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account?</Text>
              <Text
                style={styles.signUpLink}
                onPress={() => navigation.navigate('Register')}
              >
                Sign up
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;