import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Dimensions,
  Platform,
  Share,
  StatusBar,
  ImageBackground
} from 'react-native';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { allSubcategories } from '../../data/decks';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.6;

export function ShuffleScreen({ onOpen, onBack, onShareQuestion }) {
  const { theme } = useTheme();
  const [pick, setPick] = useState(() => randomPick());
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useState(new Animated.Value(0))[0];
  const scaleValue = useState(new Animated.Value(1))[0];
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentDot, setCurrentDot] = useState(0);
  const dotAnimations = useRef([
    new Animated.Value(6),
    new Animated.Value(6),
    new Animated.Value(6)
  ]).current;

  useEffect(() => {
    Animated.spring(dotAnimations[0], {
      toValue: 12,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    return () => {
      dotAnimations.forEach((dot) => dot.stopAnimation());
    };
  }, []);

  // Randomly select a category and question
  function randomPick() {
    if (!allSubcategories || allSubcategories.length === 0) {
      return { 
        category: null, 
        index: 0, 
        question: 'No categories available',
        answer: 'Please add some categories first'
      };
    }
    const c = allSubcategories[Math.floor(Math.random() * allSubcategories.length)];
    if (!c || !Array.isArray(c.questions) || c.questions.length === 0) {
      return { 
        category: c, 
        index: 0, 
        question: 'No questions available',
        answer: 'Please add some questions to this category'
      };
    }
    const qi = Math.floor(Math.random() * c.questions.length);
    return { 
      category: c, 
      index: qi, 
      question: c.questions[qi].question || c.questions[qi],
      answer: c.questions[qi].answer || 'Think about this question and discuss it with your partner'
    };
  }

  // Get a random gradient color
  const getRandomGradient = () => {
    const gradients = [
      ['#FF9A9E', '#FAD0C4'],
      ['#A1C4FD', '#C2E9FB'],
      ['#FFD1FF', '#FAD0C4'],
      ['#84FAB0', '#8FD3F4'],
      ['#A6C1EE', '#FBC2EB']
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const [gradient, setGradient] = useState(getRandomGradient());

  // Animate dots
  const animateDots = (newDotIndex) => {
    // Reset all dots to small size
    dotAnimations.forEach((dot, index) => {
      Animated.spring(dot, {
        toValue: 6,
        useNativeDriver: false,
      }).start();
    });
    
    // Animate the new active dot to be larger
    Animated.spring(dotAnimations[newDotIndex], {
      toValue: 12,
      useNativeDriver: false,
    }).start();
    
    setCurrentDot(newDotIndex);
  };

  // Handle getting another question
  const handleGetAnotherQuestion = () => {
    shakeCard();
    setShowAnswer(false);
    
    // Calculate next dot index (0, 1, 2, 0, 1, 2, ...)
    const nextDot = (currentDot + 1) % 3;
    
    // Animate dots before changing question
    animateDots(nextDot);
    
    setTimeout(() => {
      const newPick = randomPick();
      setPick(newPick);
      setGradient(getRandomGradient());
      if (isFlipped) {
        flipCard(); // Flip back to question if it was showing answer
      }
    }, 200);
  };

  // Handle sharing the current question
  const handleShareQuestion = async () => {
    try {
      const shareContent = `Question from ${pick.category?.name || 'Shuffle'}:\n\n${pick.question}\n\n- Unfold Cards App`;
      
      await Share.share({
        message: shareContent,
        title: 'Question from Unfold Cards',
      });
    } catch (error) {
      console.error('Error sharing question:', error);
    }
  };

  // Handle flip animation
  const flipCard = () => {
    Animated.timing(flipAnimation, {
      toValue: isFlipped ? 0 : 180,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.linear
    }).start(() => {
      setIsFlipped(!isFlipped);
      setShowAnswer(!showAnswer);
    });
  };

  // Handle shake animation
  const shakeCard = () => {
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1.05, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  };

  // Card component
  const QuestionCard = () => (
    <View style={styles.card}>
      <Text style={styles.cardQuestion}>{pick.question}</Text>
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View 
            key={index}
            style={[
              styles.dot, 
              { 
                width: dotAnimations[index],
                height: 6,
                borderRadius: 3,
                backgroundColor: index === currentDot ? '#4A90E2' : '#E0E0E0',
                marginHorizontal: 3,
              }
            ]} 
          />
        ))}
      </View>
    </View>
  );

  // Interpolate rotation for flip animation
  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg']
        })
      }
    ]
  };

  // Card container
  const CardContainer = () => (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleValue }] }]}>
      <QuestionCard />
    </Animated.View>
  );

  // Dots pattern background component
  const DotsPattern = () => (
    <View style={styles.dotsPatternContainer}>
      {[...Array(15)].map((_, i) => (
        <View key={i} style={styles.dotsRow}>
          {[...Array(8)].map((_, j) => (
            <View key={`${i}-${j}`} style={styles.patternDot} />
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title="Shuffle" onBack={onBack} />
      
      <View style={styles.container}>
        
        {/* Card */}
        <View style={styles.cardOuterContainer}>
          <View style={styles.cardShadow}>
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={flipCard}
              style={styles.cardTouchable}
            >
              <CardContainer />
            </TouchableOpacity>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.controls}>
          <View style={styles.topButtonsContainer}>
            <TouchableOpacity 
              style={[styles.topButton, styles.anotherButton]}
              onPress={handleGetAnotherQuestion}
            >
              <Ionicons name="refresh" size={16} color="#4A4A4A" />
              <Text style={styles.topButtonText}>Another</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.topButton, styles.shareButton]}
              onPress={handleShareQuestion}
            >
              <Ionicons name="share-social" size={16} color="#4A4A4A" />
              <Text style={styles.topButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.openCategoryButton}
            onPress={() => onOpen && onOpen(pick.category, pick.index)}
          >
            <View style={styles.categoryIconContainer}>
              <View style={[styles.categoryIconShape, styles.triangle]} />
              <View style={[styles.categoryIconShape, styles.square]} />
              <View style={[styles.categoryIconShape, styles.circle]} />
            </View>
            <Text style={styles.openCategoryButtonText}>Open Category</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Using static color to match the design
  },
  cardOuterContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 20,
  },
  cardShadow: {
    flex: 1,
    borderRadius: 16,
  },
  cardContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
    width: '100%',
  },
  cardWrapper: {
    flex: 1,
    backfaceVisibility: 'hidden',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dotsPatternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },
  dotsRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7355afff',
    marginHorizontal: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  dot: {
    // Styles are now handled inline to support animation
  },
  questionContainer: {
    width: '100%',
    alignItems: 'center',
  },
  cardQuestion: {
    fontSize: 22,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 30,
  },
  controls: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  topButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  topButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
  },
  topButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  openCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6746abff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  categoryIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryIconShape: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  triangle: {
    position: 'absolute',
    top: 0,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
  },
  square: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    backgroundColor: 'white',
    width: 8,
    height: 8,
    borderRadius: 0,
  },
  circle: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    backgroundColor: 'white',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  openCategoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ShuffleScreen;