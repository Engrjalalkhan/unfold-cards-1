import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Share, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export function CategoryQuestionsScreen({ category, onBack, onToggleFavorite, isFavorite, onShareQuestion, favorites }) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const scrollPositionRef = useRef(0); // Track scroll position to prevent loops
  
  // Handle scroll end to update current index
  const handleScrollEnd = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
    scrollPositionRef.current = index; // Track position
    console.log('Scroll ended, current index:', index);
  };

  // Preserve scroll position when favorites change - multiple attempts
  useEffect(() => {
    if (scrollViewRef.current && scrollPositionRef.current > 0) {
      const targetIndex = scrollPositionRef.current;
      
      // Multiple restoration attempts at different intervals
      const restoreAttempts = [
        { delay: 0, label: 'Immediate' },
        { delay: 50, label: 'Quick' },
        { delay: 200, label: 'Delayed' },
        { delay: 500, label: 'Final' }
      ];
      
      restoreAttempts.forEach(({ delay, label }) => {
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({ 
              x: targetIndex * width, 
              y: 0, 
              animated: false 
            });
            setCurrentIndex(targetIndex);
            console.log(`${label} scroll position restoration:`, targetIndex);
          }
        }, delay);
      });
    }
  }, [favorites, width]);
  
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

  const goToPrevious = () => {
    console.log('goToPrevious called, currentIndex:', currentIndex);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      
      // Use ScrollView scrollTo for reliable navigation
      setTimeout(() => {
        if (scrollViewRef.current) {
          const offset = newIndex * width;
          scrollViewRef.current.scrollTo({ 
            x: offset, 
            y: 0, 
            animated: true 
          });
          console.log('ScrollView scrollTo called for previous, offset:', offset);
        }
      }, 50);
    }
  };

  const goToNext = () => {
    console.log('goToNext called, currentIndex:', currentIndex, 'total:', category.questions.length);
    if (currentIndex < category.questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      
      // Use ScrollView scrollTo for reliable navigation
      setTimeout(() => {
        if (scrollViewRef.current) {
          const offset = newIndex * width;
          scrollViewRef.current.scrollTo({ 
            x: offset, 
            y: 0, 
            animated: true 
          });
          console.log('ScrollView scrollTo called for next, offset:', offset);
        }
      }, 50);
    }
  };

  const handleToggleFavorite = useCallback((category, question) => {
    console.log('Toggle favorite for question:', question, 'in category:', category.name);
    
    // Store current scroll position immediately
    const currentScrollPosition = currentIndex;
    scrollPositionRef.current = currentScrollPosition;
    
    // Call parent function
    if (onToggleFavorite) {
      onToggleFavorite(category, question);
    }
    
    // Immediate restoration attempt
    requestAnimationFrame(() => {
      if (scrollViewRef.current) {
        const offset = currentScrollPosition * width;
        scrollViewRef.current.scrollTo({ 
          x: offset, 
          y: 0, 
          animated: false 
        });
        console.log('Immediate position restoration:', currentScrollPosition);
      }
    });
    
    // Backup restoration after delay
    setTimeout(() => {
      if (scrollViewRef.current) {
        const offset = currentScrollPosition * width;
        scrollViewRef.current.scrollTo({ 
          x: offset, 
          y: 0, 
          animated: false 
        });
        setCurrentIndex(currentScrollPosition);
        console.log('Backup position restoration:', currentScrollPosition);
      }
    }, 500);
  }, [currentIndex, onToggleFavorite, width]);

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
                onPress={() => handleToggleFavorite(category, item)}
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
      {/* <View style={styles.categoryHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <Text style={styles.questionCount}>{category.questions.length} Questions</Text>
        </View>
        <Text style={[styles.categoryDescription, { color: theme.colors.textMuted }]}>
          Browse through all questions in this category
        </Text>
      </View> */}

      {/* Questions Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={true}
        snapToInterval={width}
        decelerationRate="fast"
        snapToAlignment="center"
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{
          width: width * category.questions.length,
        }}
      >
        {category.questions.map((question, index) => {
          const questionId = `${category.id}-${index}`;
          // Check if this question is favorited by looking in the favorites array
          const isFav = favorites && favorites.some(fav => 
            fav.categoryId === category.id && fav.question === question
          );
          
          return (
            <View key={questionId} style={[styles.slide, { width }]}>
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
                  
                  <Text style={styles.questionText}>{question}</Text>
                  
                  <View style={styles.questionNumber}>
                    <Text style={styles.numberText}>Question {index + 1} of {category.questions.length}</Text>
                  </View>
                  
                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    {/* Favorite Button */}
                    <TouchableOpacity 
                      onPress={() => handleToggleFavorite(category, question)}
                      style={[
                        styles.favoriteButton,
                        isFav && styles.favoriteButtonActive
                      ]}
                    >
                      <Ionicons 
                        name={isFav ? 'heart' : 'heart-outline'} 
                        size={24} 
                        color={isFav ? '#FF1493' : categoryColor} 
                      />
                    </TouchableOpacity>
                    
                    {/* Share Button */}
                    <TouchableOpacity 
                      onPress={() => handleShareQuestion(question, category.name)}
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
        })}
      </ScrollView>
      
      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.previousButton,
            currentIndex === 0 && styles.disabledButton
          ]}
          onPress={goToPrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        
        {/* Question Counter */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {category.questions.length}
          </Text>
        </View>
        
        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            currentIndex === category.questions.length - 1 && styles.disabledButton
          ]}
          onPress={goToNext}
          disabled={currentIndex === category.questions.length - 1}
        >
          <Text style={styles.navButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
  favoriteButtonActive: {
    backgroundColor: 'rgba(255, 20, 147, 0.1)',
    borderWidth: 1,
    borderColor: '#FF1493',
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
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6D6FF',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8343b1ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 100,
    justifyContent: 'center',
  },
  previousButton: {
    backgroundColor: '#8343b1ff',
  },
  nextButton: {
    backgroundColor: '#8343b1ff',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  counterContainer: {
    backgroundColor: '#F8F4FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8343b1ff',
  },
  counterText: {
    color: '#8343b1ff',
    fontSize: 14,
    fontWeight: '600',
  },
});
