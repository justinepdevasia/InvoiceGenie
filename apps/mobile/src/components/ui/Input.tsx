import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const containerStyles = [
    styles.container,
    containerStyle,
  ];

  const inputContainerStyles = [
    styles.inputContainer,
    {
      backgroundColor: theme.colors.surface,
      borderColor: error
        ? theme.colors.error
        : isFocused
        ? theme.colors.primary
        : theme.colors.border,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.sm,
    },
  ];

  const inputStyles = [
    styles.input,
    {
      color: theme.colors.text,
      fontSize: theme.fontSize.md,
      paddingLeft: leftIcon ? theme.spacing.xl : theme.spacing.md,
      paddingRight: rightIcon ? theme.spacing.xl : theme.spacing.md,
    },
    style,
  ];

  return (
    <View style={containerStyles}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text,
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View style={inputContainerStyles}>
        {leftIcon && (
          <View style={[styles.iconContainer, styles.leftIcon]}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
            />
          </View>
        )}

        <TextInput
          style={inputStyles}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && (
          <View style={[styles.iconContainer, styles.rightIcon]}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={theme.colors.textSecondary}
              onPress={onRightIconPress}
            />
          </View>
        )}
      </View>

      {error && (
        <Text
          style={[
            styles.errorText,
            {
              color: theme.colors.error,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    position: 'absolute',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftIcon: {
    left: 12,
  },
  rightIcon: {
    right: 12,
  },
  errorText: {
    marginTop: 4,
  },
});