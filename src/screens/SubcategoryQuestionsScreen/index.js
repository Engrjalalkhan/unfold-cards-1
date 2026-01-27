import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export function SubcategoryQuestionsScreen({ route, navigation }) {
  const { subcategory } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  
  // Pagination settings
  const ITEMS_PER_PAGE = 1;
  const [loadedPages, setLoadedPages] = useState(new Set([0]));
  
  // Local favorites state
  const [favorites, setFavorites] = useState(new Set());
  
  // Load favorites from storage on mount
  useEffect(() => {
    loadFavorites();
  }, []);
  
  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        const favArray = JSON.parse(storedFavorites);
        setFavorites(new Set(favArray));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };
  
  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };
  
  const handleToggleFavorite = (category, question) => {
    const favoriteKey = `${category.id}-${question}`;
    const newFavorites = new Set(favorites);
    
    // Create favorite item in the format expected by FavoritesScreen
    const favoriteItem = {
      categoryId: category.id,
      categoryName: category.name,
      color: category.color,
      question: question,
      read: false,
    };
    
    if (newFavorites.has(favoriteKey)) {
      newFavorites.delete(favoriteKey);
      // Remove from detailed favorites storage
      removeFromDetailedFavorites(favoriteKey);
    } else {
      newFavorites.add(favoriteKey);
      // Add to detailed favorites storage
      addToDetailedFavorites(favoriteKey, favoriteItem);
    }
    
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };
  
  const addToDetailedFavorites = async (key, item) => {
    try {
      const existing = await AsyncStorage.getItem('detailedFavorites');
      const detailed = existing ? JSON.parse(existing) : {};
      detailed[key] = item;
      await AsyncStorage.setItem('detailedFavorites', JSON.stringify(detailed));
    } catch (error) {
      console.error('Error adding to detailed favorites:', error);
    }
  };
  
  const removeFromDetailedFavorites = async (key) => {
    try {
      const existing = await AsyncStorage.getItem('detailedFavorites');
      const detailed = existing ? JSON.parse(existing) : {};
      delete detailed[key];
      await AsyncStorage.setItem('detailedFavorites', JSON.stringify(detailed));
    } catch (error) {
      console.error('Error removing from detailed favorites:', error);
    }
  };
  
  const checkIsFavorite = (categoryId, question) => {
    const favoriteKey = `${categoryId}-${question}`;
    return favorites.has(favoriteKey);
  };

  // Convert subcategory questions to the format expected by the carousel
  const questions = useMemo(() => {
    if (!subcategory || !subcategory.questions || !Array.isArray(subcategory.questions)) {
      return [];
    }
    
    return subcategory.questions.map((questionText, index) => ({
      id: `${subcategory.id}-${index}`,
      question: questionText,
      category: subcategory.name || 'Unknown',
      zone: subcategory.zone || 'Unknown',
      color: subcategory.color || '#8B5CF6'
    }));
  }, [subcategory]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const newIndex = currentIndex + 1;
      scrollToIndex(newIndex);
      loadPageIfNeeded(newIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      scrollToIndex(newIndex);
      loadPageIfNeeded(newIndex);
    }
  };

  const loadPageIfNeeded = (index) => {
    const pageIndex = Math.floor(index / ITEMS_PER_PAGE);
    if (!loadedPages.has(pageIndex)) {
      setLoadedPages(prev => new Set([...prev, pageIndex]));
    }
  };

  const scrollToIndex = (index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
    loadPageIfNeeded(index);
  };

  const getItemLayout = useCallback((data, index) => ({
    length: width,
    offset: width * index,
    index,
  }), []);

  const keyExtractor = useCallback((item, index) => item.id || `question-${index}`, []);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
      loadPageIfNeeded(newIndex);
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  };

  const renderQuestion = ({ item, index }) => {
    const questionId = `${item.category}-${index}`;
    const isFav = checkIsFavorite(item.category, item.question);
    
    return (
      <View style={[styles.slide, { width }]} >
        <View style={styles.cardContainer}>
          <View style={[styles.cardGradient, { backgroundColor: item.color + '15' }]} />
          
          <View style={styles.cardContent}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            
            <Text style={styles.questionText}>{item.question}</Text>
            
            <View style={styles.questionNumber}>
              <Text style={styles.numberText}>Question {index + 1} of {questions.length}</Text>
            </View>
            
            {/* Favorite Button */}
            <TouchableOpacity 
              onPress={() => handleToggleFavorite({ id: item.category, name: item.category, color: item.color }, item.question)}
              style={styles.favoriteButton}
            >
              <Ionicons 
                name={isFav ? 'heart' : 'heart-outline'} 
                size={24} 
                color={isFav ? '#FF1493' : '#8343b1ff'} 
              />
            </TouchableOpacity>
          </View>
        </View >
      </View >
    );
  };

  const renderDot = (index) => (
    <TouchableOpacity
      key={index}
      onPress={() => scrollToIndex(index)}
      style={[
        styles.dot,
        {
          backgroundColor: currentIndex === index ? '#8343b1ff' : '#E6D6FF',
          width: currentIndex === index ? 24 : 8,
        },
      ]}
    />
  );

  if (!subcategory) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#4B0082" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Error</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No subcategory data available.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} >
      <View style={styles.header} >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4B0082" />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle} > {subcategory.name} ({questions.length}) </Text >
        <View style={{ width: 40 }} />
      </View >

      <FlatList
        ref={flatListRef}
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.carousel}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={100}
        initialScrollIndex={currentIndex}
      />

      <View style={styles.footer} >
        <View style={styles.dotsContainer} >
          {questions.slice(
            Math.max(0, currentIndex - 2), 
            Math.min(questions.length, currentIndex + 3)
          ).map((_, index) => renderDot(Math.max(0, currentIndex - 2) + index))}
        </View >

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            onPress={handlePrevious}
            style={[
              styles.navButton,
              styles.previousButton,
              styles.circleButton,
              { opacity: currentIndex === 0 ? 0.5 : 1 }
            ]}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.buttonSpacer} />

          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.navButton,
              styles.nextButton,
              styles.circleButton,
              { opacity: currentIndex === questions.length - 1 ? 0.5 : 1 }
            ]}
            disabled={currentIndex === questions.length - 1}
          >
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 1,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6D6FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6D6FF',
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8343b1ff',
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
    width: width - 80,
    height: 400,
    marginHorizontal: 10,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#b89bf4ff',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2F2752',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  questionNumber: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  numberText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  navButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    minWidth: 50,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  buttonSpacer: {
    flex: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
