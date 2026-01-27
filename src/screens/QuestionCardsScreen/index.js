import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export function QuestionCardsScreen({ category, onBack, onToggleFavorite, isFavorite, onShareQuestion }) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const scrollRef = React.useRef(null);

  console.log('QuestionCardsScreen rendered with category:', category?.name, 'questions:', category?.questions?.length);

  // Defensive: ensure category exists and has questions
  if (!category || typeof category !== 'object') {
    console.log('Category is null or invalid');
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Header title="Error" onBack={onBack} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Category data is not available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!Array.isArray(category.questions) || category.questions.length === 0) {
    console.log('No questions available for category:', category.name);
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <Header title={category.name || 'Questions'} onBack={onBack} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>No questions available for this category.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleNext = () => {
    if (currentIndex < category.questions.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const scrollToIndex = (index) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
  };

  const renderQuestionCard = ({ item, index }) => {
    const questionId = `${category.id}-${index}`;
    const isFav = isFavorite(category.id, item);
    
    // Use a default color if category color is undefined
    const categoryColor = category.color || '#8B5CF6';
    console.log(`Rendering card ${index + 1} with color: ${categoryColor}`);
    
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
            <View style={styles.questionHeader}>
              <View style={[styles.questionNumber, { backgroundColor: categoryColor }]}>
                <Text style={styles.questionNumberText}>{index + 1}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => onToggleFavorite(category, item)}
                style={styles.favoriteButton}
              >
                <Ionicons 
                  name={isFav ? 'star' : 'star-outline'} 
                  size={24} 
                  color={isFav ? categoryColor : theme.colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.questionText, { color: theme.colors.text }]}>
              {item}
            </Text>
            
            <View style={styles.questionActions}>
              <TouchableOpacity 
                onPress={() => onShareQuestion && onShareQuestion(`${category.name}: ${item}`)}
                style={[styles.actionButton, { backgroundColor: theme.colors.surfaceTint }]}
              >
                <Ionicons name="share-social-outline" size={20} color={theme.colors.text} />
                <Text style={[styles.actionText, { color: theme.colors.text }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderDot = (index) => (
    <TouchableOpacity
      key={index}
      onPress={() => scrollToIndex(index)}
      style={[
        styles.dot,
        currentIndex === index && [styles.activeDot, { backgroundColor: theme.colors.primary }]
      ]}
    />
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title={category.name || 'Questions'} onBack={onBack} />
      
      <View style={styles.headerInfo}>
        <View style={[styles.infoBadge, { backgroundColor: category.color || '#8B5CF6' }]}>
          <Text style={styles.infoBadgeText}>
            Question {currentIndex + 1} of {category.questions.length}
          </Text>
        </View>
        <Text style={[styles.infoDescription, { color: theme.colors.textMuted }]}>
          Swipe through all questions or tap to share your favorites
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.carousel}
      >
        {category.questions.map((question, index) => 
          renderQuestionCard({ item: question, index })
        )}
      </ScrollView>

      <View style={styles.dotsContainer}>
        {category.questions.map((_, index) => renderDot(index))}
      </View>

      <View style={styles.navigationControls}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.prevButton,
            { 
              backgroundColor: currentIndex === 0 ? theme.colors.surfaceTint : theme.colors.primary,
              opacity: currentIndex === 0 ? 0.5 : 1
            }
          ]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.background} />
          <Text style={[styles.navButtonText, { color: theme.colors.background }]}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            { 
              backgroundColor: currentIndex === category.questions.length - 1 ? theme.colors.surfaceTint : theme.colors.primary,
              opacity: currentIndex === category.questions.length - 1 ? 0.5 : 1
            }
          ]}
          onPress={handleNext}
          disabled={currentIndex === category.questions.length - 1}
        >
          <Text style={[styles.navButtonText, { color: theme.colors.background }]}>Next</Text>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.background} />
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
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: width - 32,
    height: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  favoriteButton: {
    padding: 8,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 32,
  },
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#8B5CF6',
  },
  navigationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: 120,
    justifyContent: 'center',
  },
  prevButton: {
    alignSelf: 'flex-start',
  },
  nextButton: {
    alignSelf: 'flex-end',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 4,
  },
});
