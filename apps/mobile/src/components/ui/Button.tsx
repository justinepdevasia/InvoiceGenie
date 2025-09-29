import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradient?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  gradient = false,
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const sizeStyles = {
      sm: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
      md: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
      lg: { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: gradient ? 'transparent' : theme.colors.primary,
        ...theme.shadows.sm,
      },
      secondary: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles = {
      sm: { fontSize: theme.fontSize.sm },
      md: { fontSize: theme.fontSize.md },
      lg: { fontSize: theme.fontSize.lg },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: '#FFFFFF' },
      secondary: { color: theme.colors.text },
      outline: { color: theme.colors.primary },
      ghost: { color: theme.colors.primary },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      fontWeight: theme.fontWeight.semibold,
      marginHorizontal: icon ? theme.spacing.xs : 0,
    };
  };

  const renderContent = () => (
    <>
      {icon && iconPosition === 'left' && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
          color={getTextStyle().color}
        />
      )}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextStyle().color}
          style={{ marginHorizontal: theme.spacing.xs }}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
      {icon && iconPosition === 'right' && (
        <Ionicons
          name={icon}
          size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
          color={getTextStyle().color}
        />
      )}
    </>
  );

  const buttonStyle = [getButtonStyle(), style];

  if (variant === 'primary' && gradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[buttonStyle, { backgroundColor: 'transparent' }]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: theme.borderRadius.md },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyle}
      activeOpacity={0.8}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};