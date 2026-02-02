import React, { useState, useRef } from 'react';
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
  Share
} from 'react-native';
import { Header } from '../../navigation/Header';
import { allSubcategories } from '../../data/decks';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.5;

export function ShuffleScreen({ onOpen, onBack, onShareQuestion }) {
  const { theme } = useTheme();
  const [pick, setPick] = useState(() => randomPick());
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useState(new Animated.Value(0))[0];
  const scaleValue = useState(new Animated.Value(1))[0];
  const [showAnswer, setShowAnswer] = useState(false);

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

  // Handle getting another question
  const handleGetAnotherQuestion = () => {
    shakeCard();
    setShowAnswer(false);
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
      const shareOptions = {
        message: `Question from Unfold Cards:\n\n"${pick.question}"\n\n${pick.answer ? `Answer: ${pick.answer}` : ''}`,
        title: 'Check out this question',
        dialogTitle: 'Share Question',
      };
      
      if (onShareQuestion) {
        await onShareQuestion(shareOptions);
      } else {
        await Share.share(shareOptions);
      }
    } catch (error) {
      console.error('Error sharing question:', error);
    }
  };

  // Front of the card
  const FrontCard = () => (
    <View style={[styles.cardFace, styles.cardFront, { backgroundColor: gradient[0] }]}>
      <Text style={styles.cardCategory}>{pick.category?.name || 'General'}</Text>
      <Text style={styles.cardQuestion}>{pick.question}</Text>
      <View style={styles.flipHint}>
        <Ionicons name="repeat" size={20} color="rgba(255,255,255,0.7)" />
        <Text style={styles.flipHintText}>Tap to see answer</Text>
      </View>
    </View>
  );

  // Back of the card
  const BackCard = () => (
    <View style={[styles.cardFace, styles.cardBack, { backgroundColor: gradient[1] }]}>
      <Text style={styles.cardAnswer}>{pick.answer}</Text>
      <View style={styles.flipHint}>
        <Ionicons name="repeat" size={20} color="rgba(0,0,0,0.6)" />
        <Text style={[styles.flipHintText, { color: 'rgba(0,0,0,0.6)' }]}>Tap to see question</Text>
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

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg']
        })
      }
    ]
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title="Shuffle" showBack onBack={onBack} />
      
      <View style={styles.container}>
        <View style={styles.cardContainer}>
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={flipCard}
            style={{ flex: 1 }}
          >
            <Animated.View 
              style={[
                styles.card,
                { 
                  transform: [{ scale: scaleValue }],
                  shadowColor: gradient[0],
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 10
                }
              ]}
            >
              <Animated.View style={[styles.cardContent, frontAnimatedStyle]}>
                <FrontCard />
              </Animated.View>
              <Animated.View style={[styles.cardContent, styles.cardBack, backAnimatedStyle]}>
                <BackCard />
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.anotherButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleGetAnotherQuestion}
          >
            <Ionicons name="shuffle" size={24} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.anotherButtonText}>Another Question</Text>
          </TouchableOpacity>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
              onPress={handleShareQuestion}
            >
              <Ionicons name="share-social" size={20} color={theme.colors.primary} style={styles.buttonIcon} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                Share
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
              onPress={() => onOpen && onOpen(pick.category, pick.index)}
            >
              <Ionicons name="open" size={20} color={theme.colors.primary} style={styles.buttonIcon} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                Open Category
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  card: {
    width: width * 0.9,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    backfaceVisibility: 'hidden',
  },
  cardFace: {
    flex: 1,
    padding: 25,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFront: {
    backgroundColor: '#9D4EDD',
  },
  cardBack: {
    backgroundColor: '#C77DFF',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardCategory: {
    position: 'absolute',
    top: 20,
    left: 20,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardQuestion: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 20,
  },
  cardAnswer: {
    fontSize: 20,
    color: '#000',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 20,
  },
  flipHint: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flipHintText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  controls: {
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  anotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9D4EDD',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#9D4EDD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonIcon: {
    marginRight: 8,
  },
  anotherButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ShuffleScreen;