import React, { createContext, useContext, useState } from 'react';

export interface Theme {
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    error: string;
    warning: string;
    success: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    border: string;
    disabled: string;
    overlay: string;
    shadow: string;
    // Gradient colors
    gradientStart: string;
    gradientEnd: string;
    cardGradientStart: string;
    cardGradientEnd: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  fontWeight: {
    light: string;
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  shadows: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    lg: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

const lightTheme: Theme = {
  colors: {
    primary: '#1E88E5',
    primaryDark: '#1565C0',
    secondary: '#42A5F5',
    accent: '#0288D1',
    background: '#F5F9FC',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F7FB',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    text: '#1E293B',
    textSecondary: '#546E7A',
    textTertiary: '#78909C',
    border: '#E3F2FD',
    disabled: '#B0BEC5',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: '#000000',
    gradientStart: '#1E88E5',
    gradientEnd: '#0288D1',
    cardGradientStart: '#FFFFFF',
    cardGradientEnd: '#F0F7FB',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  shadows: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

const darkTheme: Theme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#42A5F5',
    primaryDark: '#1E88E5',
    secondary: '#64B5F6',
    background: '#0A1929',
    surface: '#1A2027',
    surfaceVariant: '#242D3A',
    text: '#E3F2FD',
    textSecondary: '#90CAF9',
    textTertiary: '#64B5F6',
    border: '#1E2936',
    disabled: '#455A64',
    overlay: 'rgba(0, 0, 0, 0.7)',
    gradientStart: '#42A5F5',
    gradientEnd: '#1E88E5',
    cardGradientStart: '#1A2027',
    cardGradientEnd: '#242D3A',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    theme,
    isDark,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};