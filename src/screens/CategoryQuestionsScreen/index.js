import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, FlatList, TouchableOpacity, Share, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export function CategoryQuestionsScreen({ category, onBack, onToggleFavorite, isFavorite, onShareQuestion }) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  
  const handleShareQuestion = async (question, categoryName) => {
    try {
      const shareContent = `Question from ${categoryName}:\n\n${question}\n\n- Unfold Cards App`;
      
      await Share.share({
        message: shareContent,
        title: 'Question from Unfold Cards',
        url: 'https://unfold-cards.app'
      });
      
      console.log('Shared category question:', question);
      
      // Also call the original onShareQuestion if provided
      if (onShareQuestion) {
        onShareQuestion(question);
      }
    } catch (error) {
      console.error('Error sharing category question:', error);
    }
  };

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
      <View style={[styles.slide, { width }]}>
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={[categoryColor + '15', categoryColor + '05']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
              <Ionicons name="help-circle-outline" size={48} color={categoryColor} />
            </View>
            
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
            
            <Text style={styles.questionText}>{item}</Text>
            
            <View style={styles.questionNumber}>
              <Text style={styles.numberText}>Question {index + 1} of {category.questions.length}</Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {/* Favorite Button */}
              <TouchableOpacity 
                onPress={() => onToggleFavorite && onToggleFavorite(category, item)}
                style={styles.favoriteButton}
              >
                <Ionicons 
                  name={isFav ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={isFav ? '#FF1493' : categoryColor} 
                />
              </TouchableOpacity>
              
              {/* Share Button */}
              <TouchableOpacity 
                onPress={() => handleShareQuestion(item, category.name)}
                style={styles.shareButton}
              >
                <Ionicons 
                  name="share-outline" 
                  size={24} 
                  color={categoryColor} 
                />
              </TouchableOpacity>
            </View>
          </View>
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

      {/* Questions Carousel */}
      <FlatList
        ref={flatListRef}
        data={category.questions}
        renderItem={renderQuestionItem}
        keyExtractor={(item, index) => `${category.id}-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
        snapToAlignment="center"
        contentContainerStyle={styles.carousel}
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
  carousel: {
    flex: 1,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
  },
  cardContainer: {
    width: width - 40,
    height: 500,
    borderRadius: 24,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: '#8343b1ff',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F2752',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  questionNumber: {
    alignItems: 'center',
  },
  numberText: {
    fontSize: 14,
    color: '#8A4FFF',
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 8,
  },
  favoriteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
