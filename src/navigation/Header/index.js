import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const getDynamicStyles = (theme) => ({
  bgSurface: { backgroundColor: theme.colors.surface },
  bgSurfaceTint: { backgroundColor: theme.colors.surfaceTint },
  textPrimary: { color: theme.colors.text },
});

export function Header({ title, onBack, right }) {
  const { theme } = useTheme();
  const dynamicStyles = getDynamicStyles(theme);
  return (
    <View style={[styles.header, dynamicStyles.bgSurface]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4B0082" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <Text style={[styles.headerTitle, dynamicStyles.textPrimary]}>{title}</Text>
      {right ? right : <View style={{ width: 40 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backText: { color: '#6B3AA0', fontSize: 16 },
  headerTitle: { color: '#5A3785', fontSize: 20, fontWeight: '600' },
});
