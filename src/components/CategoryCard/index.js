import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { hexToRgba } from '../../utils/helpers';

export function CategoryCard({ category, onPress, theme }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  
  // Defensive: ensure category exists and has required properties
  if (!category || typeof category !== 'object') {
    return null;
  }
  
  const handlePress = () => {
    console.log('CategoryCard pressed:', category.name, 'with', category.questions?.length || 0, 'questions');
    if (onPress) {
      onPress();
    } else {
      console.log('onPress is not defined for CategoryCard');
    }
  };
  
  const categoryColor = category.color || theme.colors.primary;
  const categoryName = category.name || 'Untitled';
  const categoryQuestions = category.questions || [];
  
  const tint = hexToRgba(categoryColor, 0.10);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={[styles.categoryCard, { borderColor: categoryColor || theme.colors.border }]}
      >
        <LinearGradient
          style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
          colors={[tint, '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.deckBadge, { backgroundColor: categoryColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.deckTitle}>{categoryName}</Text>
          <Text style={styles.deckSubtitle}>{categoryQuestions.length} questions</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6D6FF',
    minWidth: 260,
    shadowColor: 'rgba(124,77,255,0.18)',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    marginBottom: 10,
  },
  deckBadge: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  deckTitle: { color: '#2F2752', fontSize: 18, fontWeight: '700' },
  deckSubtitle: { color: '#7A6FA3', fontSize: 13, marginTop: 2 },
  chevron: { color: '#7A6FA3', fontSize: 24, marginLeft: 12 },
});
