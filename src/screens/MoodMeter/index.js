import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';

export function MoodMeter({ onSelect }) {
  const handleMoodSelect = (mood) => {
    if (onSelect) {
      onSelect(mood);
    }
  };
  const options = [
    { id: 'excited', emoji: '🤩', label: 'Excited' },
    { id: 'happy', emoji: '😀', label: 'Happy' },
    { id: 'calm', emoji: '🙂', label: 'Calm' },
    { id: 'neutral', emoji: '😐', label: 'Neutral' },
    { id: 'sad', emoji: '😔', label: 'Sad' },
    { id: 'angry', emoji: '😡', label: 'Angry' },
    { id: 'tired', emoji: '😴', label: 'Tired' },
    { id: 'overwhelmed', emoji: '😭', label: 'Overwhelmed' },
  ];

  return (
    <BlurView 
      intensity={120} 
      style={styles.moodOverlay}
      tint="light"
    >
      <View style={styles.moodCard}>
        <Text style={styles.moodTitle}>How are you feeling today?</Text>
        <Text style={styles.moodSubtitle}>Select one to set your vibe</Text>
        <View style={styles.moodGrid}>
          {options.map((o) => (
            <TouchableOpacity 
              key={o.id} 
              style={styles.moodItem} 
              onPress={() => handleMoodSelect(o.id)}
            >
              <Text style={styles.moodEmoji}>{o.emoji}</Text>
              <Text style={styles.moodLabel}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.moodHint}>You can change this anytime from the home screen later.</Text>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  moodOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  moodCard: {
    width: '92%',
    maxWidth: 560,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    paddingVertical: 20,
    paddingHorizontal: 16,
    // Shadow for iOS
    shadowColor: '#7A6FA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 6,
  },
  moodTitle: { color: '#2F2752', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  moodSubtitle: { color: '#7A6FA3', fontSize: 14, textAlign: 'center', marginTop: 6 },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  moodItem: {
    width: '48%',
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F5EEFF',
    borderWidth: 1,
    borderColor: '#E6D6FF',
    alignItems: 'center',
    // Shadow properties for iOS
    shadowColor: '#7A6FA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { color: '#2F2752', fontSize: 14, marginTop: 6 },
  moodHint: { color: '#7A6FA3', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
