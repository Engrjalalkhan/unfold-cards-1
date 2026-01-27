import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AnswerQuestionScreen = ({ route, navigation }) => {
  const { question } = route.params || { question: 'How are you feeling today?' };
  const [answer, setAnswer] = React.useState('');

  const handleSubmit = () => {
    // Here you can save the answer or navigate back
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6B4EFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Your Answer</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.questionText}>{question}</Text>
        
        <TextInput
          style={styles.input}
          multiline
          placeholder="Type your thoughts here..."
          value={answer}
          onChangeText={setAnswer}
          placeholderTextColor="#A0A0A0"
          textAlignVertical="top"
        />
        
        <TouchableOpacity 
          style={[styles.submitButton, !answer && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!answer}
        >
          <Text style={styles.submitButtonText}>Save Response</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 24,
    lineHeight: 32,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#2D2D2D',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
    minHeight: 200,
  },
  submitButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AnswerQuestionScreen;
