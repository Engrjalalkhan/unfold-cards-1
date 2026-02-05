import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const getDynamicStyles = (theme) => ({
  textPrimary: { color: theme.colors.text },
});

export const StatTile = React.memo(function StatTile({ icon, label, value, suffix, theme }) {
  const dynamicStyles = getDynamicStyles(theme);
  return (
    <View style={styles.statTile}>
      <View style={styles.statTileHeader}>
        <Text style={styles.statTileIcon}>{icon}</Text>
        <Text style={[styles.statTileLabel, dynamicStyles.textPrimary]}>{label}</Text>
      </View>
      <Text style={[styles.statTileValue, dynamicStyles.textPrimary]}>
        {value}{suffix ? ` ${suffix}` : ''}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  statTile: { 
    flex: 1, 
    marginRight: 8, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: '#E6D6FF', 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    shadowColor: '#7A6FA3',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  statTileHeader: { flexDirection: 'row', alignItems: 'center' },
  statTileIcon: { fontSize: 18, marginRight: 8 },
  statTileLabel: { color: '#7A6FA3', fontSize: 13 },
  statTileValue: { color: '#3B245A', fontSize: 24, fontWeight: '800', marginTop: 6 },
});
