import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, TextInput, ScrollView, KeyboardAvoidingView, Platform, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const MoodQuestionsScreen = ({ route }) => {
  const { mood } = route.params;
  const navigation = useNavigation();
  
  const handleShareQuestion = async (question, mood) => {
    try {
      const shareContent = `Question for ${mood} mood:\n\n${question}\n\n- Unfold Cards App`;
      
      await Share.share({
        message: shareContent,
        title: 'Question from Unfold Cards',
        url: 'https://unfold-cards.app'
      });
      
      console.log('Shared mood question:', question, mood);
    } catch (error) {
      console.error('Error sharing mood question:', error);
    }
  };
  
  // State for managing expanded question and answer
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [answers, setAnswers] = useState({});
  const [answerText, setAnswerText] = useState('');
  
  // Load saved answers on mount
  React.useEffect(() => {
    loadAnswers();
  }, []);
  
  const loadAnswers = async () => {
    try {
      const savedAnswers = await AsyncStorage.getItem('moodAnswers');
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }
    } catch (error) {
      console.error('Error loading answers:', error);
    }
  };
  
  const saveAnswer = async (question, answer) => {
    try {
      // Save to mood answers
      const newAnswers = { ...answers, [question]: answer };
      setAnswers(newAnswers);
      await AsyncStorage.setItem('moodAnswers', JSON.stringify(newAnswers));
      
      // Also save to discover screen submissions
      await saveToDiscoverScreen(question, answer, selectedMood);
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };
  
  const saveToDiscoverScreen = async (question, answer, mood) => {
    try {
      const existingSubmissions = await AsyncStorage.getItem('discoverSubmissions');
      const submissions = existingSubmissions ? JSON.parse(existingSubmissions) : [];
      
      // Check if this question already exists
      const existingIndex = submissions.findIndex(
        item => item.question === question && item.type === 'mood'
      );
      
      const newSubmission = {
        id: `mood-${Date.now()}`,
        question,
        answer,
        mood: mood.label,
        moodEmoji: mood.emoji,
        type: 'mood',
        timestamp: new Date().toISOString()
      };
      
      if (existingIndex >= 0) {
        // Update existing submission
        submissions[existingIndex] = newSubmission;
      } else {
        // Add new submission
        submissions.push(newSubmission);
      }
      
      await AsyncStorage.setItem('discoverSubmissions', JSON.stringify(submissions));
      console.log('Saved to discover screen:', newSubmission);
    } catch (error) {
      console.error('Error saving to discover screen:', error);
    }
  };
  
  const handleQuestionPress = (question) => {
    if (expandedQuestion === question) {
      setExpandedQuestion(null);
      setAnswerText('');
    } else {
      setExpandedQuestion(question);
      setAnswerText(answers[question] || '');
    }
  };
  
  const handleSaveAnswer = () => {
    if (expandedQuestion && answerText.trim()) {
      saveAnswer(expandedQuestion, answerText.trim());
      setExpandedQuestion(null);
      setAnswerText('');
    }
  };
  
  const handleDeleteAnswer = async (question) => {
    try {
      const newAnswers = { ...answers };
      delete newAnswers[question];
      setAnswers(newAnswers);
      await AsyncStorage.setItem('moodAnswers', JSON.stringify(newAnswers));
      setExpandedQuestion(null);
      setAnswerText('');
    } catch (error) {
      console.error('Error deleting answer:', error);
    }
  };

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

  const renderQuestion = ({ item }) => {
    const isExpanded = expandedQuestion === item;
    const hasAnswer = answers[item];
    
    return (
      <View style={styles.questionContainer}>
        <TouchableOpacity 
          style={styles.questionCard}
          onPress={() => handleQuestionPress(item)}
        >
          <View style={styles.questionHeader}>
            <Text style={styles.questionText}>{item}</Text>
            <View style={styles.questionStatus}>
              {hasAnswer && (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              )}
              <TouchableOpacity 
                onPress={() => handleShareQuestion(item, mood)}
                style={styles.shareIconButton}
              >
                <Ionicons 
                  name="share-outline" 
                  size={20} 
                  color="#8343b1ff" 
                />
              </TouchableOpacity>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#8343b1ff" 
              />
            </View>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerSection}>
            {hasAnswer && !answerText && (
              <View style={styles.savedAnswer}>
                <Text style={styles.savedAnswerLabel}>Your answer:</Text>
                <Text style={styles.savedAnswerText}>{answers[item]}</Text>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAnswer(item)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF5252" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.answerInputContainer}>
              <TextInput
                style={styles.answerInput}
                multiline
                placeholder="Share your thoughts..."
                placeholderTextColor="#999"
                value={answerText}
                onChangeText={setAnswerText}
                textAlignVertical="top"
                autoFocus
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.submitButton, !answerText.trim() && styles.disabledButton]}
              onPress={handleSaveAnswer}
              disabled={!answerText.trim()}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6B4EFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Questions for when you're feeling</Text>
        <View style={styles.moodContainer}>
          <Text style={styles.moodEmoji}>{selectedMood.emoji}</Text>
          <Text style={styles.moodLabel}>{selectedMood.label}</Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <FlatList
          data={questions}
          renderItem={renderQuestion}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5FF',
  },
  scrollView: {
    flex: 1,
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
    padding: 4,
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
  questionContainer: {
    marginBottom: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  questionText: {
    fontSize: 16,
    color: '#2F2752',
    lineHeight: 24,
    flex: 1,
    marginRight: 12,
  },
  questionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  savedAnswer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  savedAnswerLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  savedAnswerText: {
    fontSize: 14,
    color: '#2F2752',
    lineHeight: 20,
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#FF5252',
    marginLeft: 4,
    fontWeight: '500',
  },
  shareIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  answerInputContainer: {
    marginBottom: 16,
  },
  answerInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2F2752',
    borderWidth: 1,
    borderColor: '#E6D6FF',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#8343b1ff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MoodQuestionsScreen;
