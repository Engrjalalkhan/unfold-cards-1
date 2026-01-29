import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { zones } from '../../data/decks';

const { width } = Dimensions.get('window');

function AllQuestionsScreen({ navigation, onToggleFavorite, isFavorite, onShareQuestion, favorites: appFavorites }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  
  // Pagination settings
  const ITEMS_PER_PAGE = 1;
  const [loadedPages, setLoadedPages] = useState(new Set([0]));

  // Load all questions from all zones with subcategory organization
  const allQuestions = useMemo(() => {
    const questions = [];
    
    zones.forEach(zone => {
      if (zone.subcategories && Array.isArray(zone.subcategories)) {
        zone.subcategories.forEach(subcategory => {
          if (subcategory.questions && Array.isArray(subcategory.questions)) {
            subcategory.questions.forEach((questionText, index) => {
              questions.push({
                id: `${subcategory.id}-${index}`,
                question: questionText,
                category: subcategory.name || 'Unknown',
                zone: zone.name || 'Unknown',
                color: subcategory.color || zone.color || '#8B5CF6'
              });
            });
          }
        });
      }
    });
    
    console.log(`Loaded ${questions.length} total questions from all zones`);
    return questions;
  }, []);

  const handleNext = () => {
    if (currentIndex < allQuestions.length - 1) {
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

  const handleToggleFavorite = (item, question) => {
    console.log('Toggle favorite called for:', question, 'in category:', item.category);
    if (onToggleFavorite) {
      // Create a category object similar to what CategoryQuestionsScreen expects
      const category = {
        id: item.categoryId || item.category?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
        name: item.category,
        color: item.color || '#8B5CF6'
      };
      onToggleFavorite(category, question);
    }
  };
  
  const handleShareQuestion = async (question, category) => {
    try {
      const shareContent = `Question from ${category}:\n\n${question}\n\n- Unfold Cards App`;
      
      await Share.share({
        message: shareContent,
        title: 'Question from Unfold Cards',
        url: 'https://unfold-cards.app' // Optional: add your app URL
      });
      
      console.log('Shared question:', question);
    } catch (error) {
      console.error('Error sharing question:', error);
    }
  };

  const checkIsFavorite = (categoryId, question) => {
    if (isFavorite) {
      return isFavorite(categoryId, question);
    }
    // Fallback to checking appFavorites if isFavorite is not provided
    return appFavorites && appFavorites.some(fav => 
      fav.categoryId === categoryId && fav.question === question
    );
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
    const isFav = checkIsFavorite(item.category, item.question);
    
    return (
      <View style={[styles.slide, { width }]} >
        <View style={styles.cardContainer}>
          <LinearGradient
            colors={[item.color + '15', item.color + '05']}
            style={styles.cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
              <Ionicons name="help-circle-outline" size={48} color={item.color} />
            </View>
            
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
            
            <Text style={styles.questionText}>{item.question}</Text>
            
            <View style={styles.questionNumber}>
              <Text style={styles.numberText}>Question {index + 1} of {allQuestions.length}</Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {/* Favorite Icon */}
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={() => handleToggleFavorite(item, item.question)}
              >
                <Ionicons 
                  name={isFav ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={isFav ? '#FF6B6B' : '#8343b1ff'} 
                />
              </TouchableOpacity>
              
              {/* Share Icon */}
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => handleShareQuestion(item.question, item.category)}
              >
                <Ionicons 
                  name="share-outline" 
                  size={24} 
                  color="#8343b1ff" 
                />
              </TouchableOpacity>
            </View>
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

  return (
    <View style={styles.container} >
      <View style={styles.header} >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#4B0082" />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle} > All Questions ({allQuestions.length}) </Text >
        <View style={{ width: 40 }} />
      </View >

      <FlatList
        ref={flatListRef}
        data={allQuestions}
        renderItem={renderQuestion}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={width}
        decelerationRate="fast"
        snapToAlignment="center"
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
          {allQuestions.slice(
            Math.max(0, currentIndex - 2), 
            Math.min(allQuestions.length, currentIndex + 3)
          ).map((_, index) => renderDot(Math.max(0, currentIndex - 2) + index))}
        </View >

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            onPress={handlePrevious}
            style={[
              styles.navButton,
              styles.previousButton,
              styles.previousCircleButton,
              styles.leftArrowButton,
              { opacity: currentIndex === 0 ? 0.5 : 1 }
            ]}
            disabled={currentIndex === 0}
          >
            <Ionicons name="arrow-back" size={20} color="#8343b1ff" />
          </TouchableOpacity>

          <View style={styles.centerSpacer} />

          <TouchableOpacity
            onPress={handleNext}
            style={[
              styles.navButton,
              styles.nextButton,
              styles.circleButton,
              styles.rightArrowButton,
              { opacity: currentIndex === allQuestions.length - 1 ? 0.5 : 1 }
            ]}
            disabled={currentIndex === allQuestions.length - 1}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  zoneTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 24,
  },
  zoneText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  leftArrowButton: {
    alignSelf: 'flex-start',
  },
  rightArrowButton: {
    alignSelf: 'flex-end',
  },
  centerSpacer: {
    flex: 1,
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
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#8343b1ff',
  },
  nextButton: {
    backgroundColor: '#8343b1ff',
    borderWidth: 2,
    borderColor: '#8343b1ff',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
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
  actionButtons: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 8,
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

export default AllQuestionsScreen;
