import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';

export function QuestionsListScreen({ category, onBack, onToggleFavorite, isFavorite, onShareQuestion }) {
  const { theme } = useTheme();
  // Defensive: ensure category exists and has questions
  if (!category || typeof category !== 'object' || !Array.isArray(category.questions)) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Header title="Error" onBack={onBack} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Category data is not available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Debug: Log category details
  console.log(`QuestionsListScreen: Category "${category.name}" loaded with ${category.questions.length} questions`);

  const renderQuestion = ({ item, index }) => {
    const questionId = `${category.id}-${index}`;
    const isFav = isFavorite(category.id, item);
    
    return (
      <View style={[styles.questionCard, { borderColor: category.color }]}>
        <View style={styles.questionHeader}>
          <Text style={[styles.questionNumber, { color: category.color }]}>
            {index + 1}
          </Text>
          <TouchableOpacity 
            onPress={() => onToggleFavorite(category, item)}
            style={styles.favoriteButton}
          >
            <Ionicons 
              name={isFav ? 'star' : 'star-outline'} 
              size={20} 
              color={isFav ? category.color : theme.colors.textMuted} 
            />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.questionText, { color: theme.colors.text }]}>
          {item}
        </Text>
        
        <View style={styles.questionActions}>
          <TouchableOpacity 
            onPress={() => onShareQuestion && onShareQuestion(`${category.name}: ${item}`)}
            style={styles.actionButton}
          >
            <Ionicons name="share-social-outline" size={18} color={theme.colors.textMuted} />
            <Text style={[styles.actionText, { color: theme.colors.textMuted }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title={category.name || 'Questions'} onBack={onBack} />
      
      <View style={styles.headerInfo}>
        <View style={[styles.infoBadge, { backgroundColor: category.color }]}>
          <Text style={styles.infoBadgeText}>{category.questions.length} Questions</Text>
        </View>
        <Text style={[styles.infoDescription, { color: theme.colors.textMuted }]}>
          Swipe through all questions or tap to share your favorites
        </Text>
      </View>

      <FlatList
        data={category.questions}
        renderItem={renderQuestion}
        keyExtractor={(item, index) => `${category.id}-${index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    color: '#2F2752', 
    fontSize: 16, 
    textAlign: 'center' 
  },
  headerInfo: {
    padding: 16,
    alignItems: 'center',
  },
  infoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  infoBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoDescription: {
    fontSize: 13,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  favoriteButton: {
    padding: 4,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 13,
    marginLeft: 6,
  },
});
