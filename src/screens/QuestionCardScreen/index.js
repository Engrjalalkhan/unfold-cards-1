import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export function QuestionCardScreen({ route, navigation }) {
  const { questions, currentIndex = 0 } = route.params || {};
  
  // If no questions are provided, show a message
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % totalQuestions;
    navigation.setParams({ currentIndex: nextIndex });
  };

  const goToPrevious = () => {
    const prevIndex = (currentIndex - 1 + totalQuestions) % totalQuestions;
    navigation.setParams({ currentIndex: prevIndex });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#6B4EFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Question {currentIndex + 1}/{totalQuestions}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.quoteMark}>"</Text>
          <Text style={styles.questionText}>{currentQuestion}</Text>
          <View style={styles.dotsContainer}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.dot, 
                  i === 1 ? styles.activeDot : null
                ]} 
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.navigation}>
        <TouchableOpacity onPress={goToPrevious} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#6B4EFF" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNext} style={[styles.navButton, styles.nextButton]}>
          <Text style={[styles.navButtonText, styles.nextButtonText]}>Next</Text>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#6B4EFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  quoteMark: {
    fontSize: 48,
    color: '#6B4EFF',
    fontWeight: 'bold',
    marginBottom: -20,
    marginTop: -20,
  },
  questionText: {
    fontSize: 22,
    color: '#2D2D4B',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 30,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0DDFF',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#6B4EFF',
    width: 16,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0EEFF',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0DDFF',
    backgroundColor: 'white',
  },
  nextButton: {
    backgroundColor: '#6B4EFF',
    borderWidth: 0,
    flexDirection: 'row-reverse',
  },
  navButtonText: {
    marginHorizontal: 8,
    color: '#6B4EFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: 'white',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default QuestionCardScreen;
