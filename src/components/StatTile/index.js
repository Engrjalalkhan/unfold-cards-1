import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const getDynamicStyles = (theme, isDark) => ({
  textPrimary: { color: isDark ? '#FFFFFF' : theme.colors.text },
  tile: { 
    backgroundColor: isDark ? '#1E1E1E' : '#F5F5F5',
    borderColor: isDark ? '#333' : '#E0E0E0',
    shadowColor: isDark ? '#000' : '#BDBDBD',
  },
  label: { color: isDark ? '#A0A0A0' : '#7A6FA3' },
  value: { color: isDark ? '#FFFFFF' : '#3B245A' }
});

export const StatTile = React.memo(function StatTile({ icon, label, value, suffix, theme, isDark = false }) {
  const dynamicStyles = getDynamicStyles(theme, isDark);
  
  // Clone the icon and update its color based on theme
  const themedIcon = React.cloneElement(icon, {
    color: isDark ? '#FFFFFF' : icon.props.color || '#7A6FA3'
  });
  
  return (
    <View style={[styles.statTile, dynamicStyles.tile]}>
      <View style={styles.statTileHeader}>
        <Text style={[styles.statTileIcon, {color: isDark ? '#FFFFFF' : '#7A6FA3'}]}>
          {themedIcon}
        </Text>
        <Text style={[styles.statTileLabel, dynamicStyles.label]}>{label}</Text>
      </View>
      <Text style={[styles.statTileValue, dynamicStyles.value]}>
        {value}{suffix ? ` ${suffix}` : ''}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  statTile: { 
    flex: 1, 
    marginRight: 8, 
    borderRadius: 18, 
    borderWidth: 1, 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  statTileHeader: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  statTileIcon: { 
    fontSize: 18, 
    marginRight: 8 
  },
  statTileLabel: { 
    fontSize: 13 
  },
  statTileValue: { 
    fontSize: 24, 
    fontWeight: '800', 
    marginTop: 6 
  },
});
