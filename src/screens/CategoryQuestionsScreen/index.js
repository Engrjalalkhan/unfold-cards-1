import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';

export function CategoryQuestionsScreen({ category, onBack, onToggleFavorite, isFavorite, onShareQuestion }) {
  const { theme } = useTheme();

  console.log('CategoryQuestionsScreen rendered with:', category?.name, 'questions:', category?.questions?.length);

  // Use zone color or default color
  const categoryColor = category.color || '#8B5CF6';

  // Defensive checks
  if (!category || typeof category !== 'object') {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Header title="Error" onBack={onBack} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Category not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!Array.isArray(category.questions) || category.questions.length === 0) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Header title={category.name || 'Questions'} onBack={onBack} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>No questions available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderQuestionItem = ({ item, index }) => {
    const questionId = `${category.id}-${index}`;
    const isFav = isFavorite(category.id, item);
    
    return (
      <View style={[styles.questionItem, { backgroundColor: theme.colors.surface }]}>
        {/* Question Number */}
        <View style={[styles.questionNumberContainer, { backgroundColor: categoryColor }]}>
          <Text style={styles.questionNumber}>{index + 1}</Text>
        </View>
        
        {/* Question Text */}
        <View style={styles.questionContent}>
          <Text style={[styles.questionText, { color: theme.colors.text }]}>
            {item}
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.questionActions}>
          <TouchableOpacity 
            onPress={() => onToggleFavorite && onToggleFavorite(category, item)}
            style={styles.actionButton}
          >
            <Ionicons 
              name={isFav ? 'star' : 'star-outline'} 
              size={20} 
              color={isFav ? categoryColor : theme.colors.textMuted} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => onShareQuestion && onShareQuestion(`${category.name}: ${item}`)}
            style={styles.actionButton}
          >
            <Ionicons 
              name="share-social-outline" 
              size={20} 
              color={theme.colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title={category.name || 'Questions'} onBack={onBack} />
      
      {/* Category Header */}
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <Text style={styles.questionCount}>{category.questions.length} Questions</Text>
        </View>
        <Text style={[styles.categoryDescription, { color: theme.colors.textMuted }]}>
          Browse through all questions in this category
        </Text>
      </View>

      {/* Questions List */}
      <FlatList
        data={category.questions}
        renderItem={renderQuestionItem}
        keyExtractor={(item, index) => `${category.id}-${index}`}
        contentContainerStyle={styles.questionsList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  errorText: { 
    fontSize: 16, 
    textAlign: 'center' 
  },
  categoryHeader: {
    padding: 16,
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  categoryTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  questionCount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  categoryDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  questionsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  questionContent: {
    flex: 1,
    marginRight: 12,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  separator: {
    height: 8,
  },
});
