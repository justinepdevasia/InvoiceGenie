import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const AnalysisScreen = () => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      color: theme.colors.text,
      fontSize: theme.fontSize.lg,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Analysis Screen</Text>
    </View>
  );
};

export default AnalysisScreen;