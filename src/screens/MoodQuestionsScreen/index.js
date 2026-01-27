import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const MoodQuestionsScreen = ({ route }) => {
  const { mood } = route.params;
  const navigation = useNavigation();

  // Find the mood object based on the mood id
  const moodOptions = {
    'excited': { id: 'excited', emoji: '🤩', label: 'Excited' },
    'happy': { id: 'happy', emoji: '😀', label: 'Happy' },
    'calm': { id: 'calm', emoji: '🙂', label: 'Calm' },
    'neutral': { id: 'neutral', emoji: '😐', label: 'Neutral' },
    'sad': { id: 'sad', emoji: '😔', label: 'Sad' },
    'angry': { id: 'angry', emoji: '😡', label: 'Angry' },
    'tired': { id: 'tired', emoji: '😴', label: 'Tired' },
    'overwhelmed': { id: 'overwhelmed', emoji: '😭', label: 'Overwhelmed' },
  };

  const selectedMood = moodOptions[mood] || moodOptions['neutral'];
  const moodLabel = selectedMood.label.toLowerCase();

  // Mood-specific questions
  const questions = [
    `How does being ${moodLabel} affect your day?`,
    `What helps you when you feel ${moodLabel}?`,
    `Who do you talk to when you feel ${moodLabel}?`,
    `What's one thing you'd like to do when you feel ${moodLabel}?`,
    `How do you want others to support you when you're ${moodLabel}?`
  ];

  const handleQuestionPress = (question) => {
    console.log('Question pressed:', question);
  };

  const renderQuestion = ({ item }) => (
    <TouchableOpacity 
      style={styles.questionCard}
      onPress={() => handleQuestionPress(item)}
    >
      <Text style={styles.questionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Questions for when you're feeling</Text>
        <View style={styles.moodContainer}>
          <Text style={styles.moodEmoji}>{selectedMood.emoji}</Text>
          <Text style={styles.moodLabel}>{selectedMood.label}</Text>
        </View>
      </View>
      
      <FlatList
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5FF',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6D6FF',
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#6B4EFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F2752',
    marginBottom: 8,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2F2752',
  },
  listContainer: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    color: '#2F2752',
    lineHeight: 24,
  },
});

export default MoodQuestionsScreen;
