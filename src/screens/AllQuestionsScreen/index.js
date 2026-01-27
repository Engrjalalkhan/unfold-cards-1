import React, { useState, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { zones } from '../../data/decks';

const { width } = Dimensions.get('window');

function AllQuestionsScreen({ navigation }) {
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

  const renderQuestion = ({ item, index }) => (
    <View style={[styles.slide, { width }]} >
      <View style={styles.cardContainer}>
        <View style={[styles.cardGradient, { backgroundColor: item.color + '15' }]} />
        
        <View style={styles.cardContent}>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          <Text style={styles.questionText}>{item.question}</Text>
          
          <View style={styles.questionNumber}>
            <Text style={styles.numberText}>Question {index + 1} of {allQuestions.length}</Text>
          </View>
        </View>
      </View >
    </View >
  );

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
              { opacity: currentIndex === allQuestions.length - 1 ? 0.5 : 1 }
            ]}
            disabled={currentIndex === allQuestions.length - 1}
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
});

export default AllQuestionsScreen;
