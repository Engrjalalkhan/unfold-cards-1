import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export function BottomNav({ current, favoritesCount }) {
  const navigation = useNavigation();
  
  const item = (key, label, iconName, count = 0) => (
    <TouchableOpacity 
      key={key}
      style={styles.navItem} 
      onPress={() => navigation.navigate(key)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={iconName}
        size={22}
        color={current === key ? '#6C63FF' : '#9AA0A6'}
        style={styles.navIcon}
      />
      {key === 'favorites' && count > 0 && (
        <View style={styles.navBadge}>
          <Text style={styles.navBadgeText}>{count}</Text>
        </View>
      )}
      <Text style={[styles.navLabel, current === key && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.bottomNav}>
      {item('Home', 'HOME', 'home')}
      {item('Favorites', 'FAVORITES', 'sparkles', favoritesCount)}
      {item('Shuffle', 'SHUFFLE', 'shuffle')}
      {item('Profile', 'PROFILE', 'person')}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#EEE9F5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: 14,
    zIndex: 100,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 6,
    position: 'relative',
  },
  navIcon: {
    marginBottom: 4,
  },
  navLabel: {
    color: '#9AA0A6',
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#6C63FF',
  },
  navBadge: {
    position: 'absolute',
    top: -2,
    right: 10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
