import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  Animated, 
  FlatList,
  Dimensions,
  Share,
  Alert,
  StatusBar,
  useWindowDimensions,
  Platform,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Responsive scaling function
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Responsive font size
const responsiveFontSize = (size) => {
  const scaleFactor = Math.min(SCREEN_WIDTH / BASE_WIDTH, 1.5);
  return size * scaleFactor;
};

const DiscoverScreen = ({ route, onBack }) => {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(Math.min(windowWidth - scale(40), 500));
  const [cardHeight, setCardHeight] = useState(windowHeight * 0.6);
  
  const handleShareAnswer = async (question, answer, mood) => {
    try {
      const shareContent = `Question: ${question}\n\nAnswer: ${answer}\n\nMood: ${mood}\n\n- Unfold Cards App`;
      
      await Share.share({
        message: shareContent,
        title: 'Question & Answer from Unfold Cards',
        url: 'https://unfold-cards.app'
      });
      
      console.log('Shared answer:', question, answer, mood);
    } catch (error) {
      console.error('Error sharing answer:', error);
      Alert.alert('Error', 'Could not share the answer. Please try again.');
    }
  };
  
  const handleDeleteAnswer = async (itemId) => {
    Alert.alert(
      'Delete Answer',
      'Are you sure you want to delete this answer? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const existingSubmissions = await AsyncStorage.getItem('discoverSubmissions');
              const submissions = existingSubmissions ? JSON.parse(existingSubmissions) : [];
              
              // Remove the item with the matching id
              const updatedSubmissions = submissions.filter(item => item.id !== itemId);
              
              await AsyncStorage.setItem('discoverSubmissions', JSON.stringify(updatedSubmissions));
              
              // Update state to refresh the UI
              setSubmittedQuestions(updatedSubmissions.map(item => ({
                ...item,
                key: item.id
              })));
              
              console.log('Deleted answer with id:', itemId);
              
              // Adjust current index if necessary
              if (currentIndex >= updatedSubmissions.length && currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
              }
            } catch (error) {
              console.error('Error deleting answer:', error);
              Alert.alert('Error', 'Could not delete the answer. Please try again.');
            }
          },
        },
      ]
    );
  };
  
  // Handle back button press with proper navigation
  const handleBack = React.useCallback(() => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
    return true;
  }, [navigation, onBack]);
  
  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBack
    );
    return () => backHandler.remove();
  }, [handleBack]);
  
  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBack
    );

    return () => backHandler.remove();
  }, [handleBack]);
  
  // Load submitted questions from storage
  const [submittedQuestions, setSubmittedQuestions] = useState([]);
  
  useEffect(() => {
    loadSubmittedQuestions();
  }, []);
  
  const loadSubmittedQuestions = async () => {
    try {
      const storedSubmissions = await AsyncStorage.getItem('discoverSubmissions');
      const submissions = storedSubmissions ? JSON.parse(storedSubmissions) : [];
      
      // Combine with default questions if no submissions
      const defaultQuestions = [
        { 
          id: '1', 
          question: 'What was the highlight of your day today?',
          answer: 'The highlight of my day was having lunch with an old friend.',
          type: 'default'
        },
        { 
          id: '2', 
          question: 'What are you most grateful for right now?',
          answer: 'I\'m grateful for my family and good health.',
          type: 'default'
        },
        { 
          id: '3', 
          question: 'What challenge are you currently facing?',
          answer: 'I\'m working on improving my time management skills.',
          type: 'default'
        },
      ];
      
      const allQuestions = submissions.length > 0 ? submissions : defaultQuestions;
      
      setSubmittedQuestions(allQuestions.map(item => ({
        ...item,
        key: item.id
      })));
    } catch (error) {
      console.error('Error loading submitted questions:', error);
    }
  };

  // Update dimensions on orientation change
  useEffect(() => {
    const updateDimensions = () => {
      const { width, height } = Dimensions.get('window');
      const isPortrait = height > width;
      
      setCardWidth(Math.min(width - scale(40), 500));
      setCardHeight(isPortrait ? height * 0.6 : height * 0.7);
    };

    const subscription = Dimensions.addEventListener('change', updateDimensions);
    updateDimensions();
    
    return () => {
      subscription?.remove();
    };
  }, []);

  const renderItem = React.useCallback(({ item, index }) => {
    const isMoodSubmission = item.type === 'mood';
    
    return (
      <View style={[styles.slide, { width: cardWidth }]}>
        <View style={[styles.card, { minHeight: cardHeight }]}>
          {/* Mood indicator for mood submissions */}
          {isMoodSubmission && (
            <View style={styles.moodIndicator}>
              <Text style={styles.moodEmoji}>{item.moodEmoji}</Text>
              <Text style={styles.moodLabel}>{item.mood}</Text>
            </View>
          )}
          
          <Text 
            style={styles.questionText} 
            numberOfLines={3} 
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {item.question}
          </Text>
          
          <View style={styles.answerContainer}>
            <Text style={styles.answerLabel}>Your Answer:</Text>
            <Text 
              style={styles.answerText}
              numberOfLines={5}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {item.answer}
            </Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Delete Button */}
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteAnswer(item.id)}
            >
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color="#FF4444" 
              />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
            
            {/* Share Button */}
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => handleShareAnswer(item.question, item.answer, item.mood || 'No mood')}
            >
              <Ionicons 
                name="share-outline" 
                size={20} 
                color="#8343b1ff" 
              />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.pagination}>
            {submittedQuestions.map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.paginationDot, 
                  i === index ? styles.paginationDotActive : null
                ]} 
              />
            ))}
          </View>
        </View>
      </View>
    );
  }, [cardWidth, cardHeight, submittedQuestions]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Memoize the header component for better performance
  const Header = React.useMemo(() => (
    <View style={[styles.header, { 
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      paddingHorizontal: scale(20)
    }]} >
      <TouchableOpacity 
        onPress={handleBack}
        style={[styles.backButton, {
          width: scale(40),
          height: scale(40),
          borderRadius: scale(20)
        }]}
      >
        <Ionicons 
          name="arrow-back" 
          size={scale(24)} 
          color="#4B0082" 
        />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { fontSize: responsiveFontSize(18) }]}>
        Your Journey
      </Text>
      <View style={{ width: scale(40) }} />
    </View>
  ), [handleBack, responsiveFontSize]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F0FF" />
      {Header}
      
      {/* Progress Bar */}
      <View style={[styles.progressContainer, { marginVertical: verticalScale(10) }]}>
        {submittedQuestions.length > 0 && (
          <View style={[
            styles.progressBar, 
            { 
              width: `${((currentIndex + 1) / submittedQuestions.length) * 100}%`,
              backgroundColor: '#8A2BE2',
            }
          ]} />
        )}
      </View>

      {/* Carousel */}
      <View style={[styles.carouselContainer, { marginTop: verticalScale(10) }]}>
        {submittedQuestions.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons 
              name="document-text-outline" 
              size={scale(80)} 
              color="#E6D7FF" 
            />
            <Text style={[styles.emptyStateTitle, { fontSize: responsiveFontSize(20) }]}>
              No Questions Added Yet
            </Text>
            <Text style={[styles.emptyStateSubtitle, { fontSize: responsiveFontSize(16) }]}>
              Start answering questions from the home screen to see them here!
            </Text>
          </View>
        ) : (
          <Animated.FlatList
            ref={flatListRef}
            data={submittedQuestions}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={cardWidth + scale(20)}
            decelerationRate="fast"
            snapToAlignment="center"
            contentContainerStyle={[
              styles.carouselContent,
              { paddingHorizontal: scale(10) }
            ]}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { 
                useNativeDriver: false,
                useNativeDriverForScrollEvents: false 
              }
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(data, index) => ({
              length: cardWidth + scale(20),
              offset: (cardWidth + scale(20)) * index,
              index,
            })}
            maxToRenderPerBatch={3}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            initialNumToRender={1}
          />
        )}
      </View>

      {/* Navigation Buttons */}
      <View style={[styles.navigationContainer, { 
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(20)
      }]}>
        {currentIndex > 0 && (
          <TouchableOpacity 
            style={[styles.navButton, {
              paddingVertical: verticalScale(10),
              paddingHorizontal: scale(15)
            }]}
            onPress={() => {
              if (currentIndex > 0) {
                flatListRef.current.scrollToIndex({
                  index: currentIndex - 1,
                  animated: true
                });
              }
            }}
          >
            <Ionicons name="arrow-back" size={scale(20)} color="#4B0082" />
            <Text style={[styles.navButtonText, { fontSize: responsiveFontSize(14) }]}>
              Previous
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }} />
        
        {currentIndex < submittedQuestions.length - 1 ? (
          <TouchableOpacity 
            style={[styles.navButton, { 
              flexDirection: 'row-reverse',
              paddingVertical: verticalScale(10),
              paddingHorizontal: scale(15)
            }]}
            onPress={() => {
              if (currentIndex < submittedQuestions.length - 1) {
                flatListRef.current.scrollToIndex({
                  index: currentIndex + 1,
                  animated: true
                });
              }
            }}
          >
            <Ionicons name="arrow-forward" size={scale(20)} color="#4B0082" />
            <Text style={[styles.navButtonText, { fontSize: responsiveFontSize(14) }]}>
              Next
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.doneButton, {
              paddingVertical: verticalScale(12),
              paddingHorizontal: scale(30),
              borderRadius: scale(25)
            }]}
            onPress={handleBack}
          >
            <Text style={[styles.doneButtonText, { fontSize: responsiveFontSize(16) }]}>
              Done
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(15),
    backgroundColor: '#F5F0FF',
  },
  backButton: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontWeight: '600',
    color: '#4B0082',
    textAlign: 'center',
  },
  progressContainer: {
    height: verticalScale(4),
    backgroundColor: '#E6D7FF',
    marginHorizontal: scale(20),
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: verticalScale(20),
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8A2BE2',
  },
  carouselContainer: {
    flex: 1,
    marginBottom: verticalScale(20),
  },
  carouselContent: {
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(40),
  },
  emptyStateTitle: {
    color: '#4B0082',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
  },
  emptyStateSubtitle: {
    color: '#8A4FFF',
    textAlign: 'center',
    lineHeight: scale(24),
  },
  slide: {
    paddingHorizontal: scale(10),
  },
  card: {
    backgroundColor: 'white',
    borderRadius: scale(20),
    padding: scale(25),
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E6FF',
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(12),
    marginBottom: verticalScale(15),
    alignSelf: 'flex-start',
  },
  moodEmoji: {
    fontSize: scale(16),
    marginRight: scale(6),
  },
  moodLabel: {
    fontSize: responsiveFontSize(12),
    color: '#8A4FFF',
    fontWeight: '500',
  },
  questionText: {
    fontWeight: '600',
    color: '#4B0082',
    marginBottom: verticalScale(30),
    textAlign: 'center',
    lineHeight: scale(32),
    fontSize: responsiveFontSize(24),
  },
  answerContainer: {
    backgroundColor: '#F9F5FF',
    borderRadius: scale(15),
    padding: scale(20),
    marginTop: verticalScale(20),
  },
  answerLabel: {
    color: '#8A4FFF',
    marginBottom: verticalScale(8),
    fontWeight: '500',
    fontSize: responsiveFontSize(14),
  },
  answerText: {
    color: '#4B0082',
    lineHeight: scale(24),
    fontSize: responsiveFontSize(16),
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(131, 67, 177, 0.1)',
    borderRadius: scale(20),
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(131, 67, 177, 0.3)',
  },
  shareButtonText: {
    color: '#8343b1ff',
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
    marginLeft: scale(6),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: verticalScale(15),
    paddingHorizontal: scale(10),
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: scale(20),
    paddingVertical: scale(8),
    paddingHorizontal: scale(16),
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  deleteButtonText: {
    color: '#FF4444',
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
    marginLeft: scale(6),
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: verticalScale(30),
  },
  paginationDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#E6D7FF',
    marginHorizontal: scale(4),
  },
  paginationDotActive: {
    backgroundColor: '#8A2BE2',
    width: scale(24),
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(30),
    paddingBottom: verticalScale(30),
    paddingTop: verticalScale(10),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: scale(20),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(15),
  },
  navButtonText: {
    color: '#4B0082',
    fontWeight: '500',
    marginHorizontal: scale(5),
    fontSize: responsiveFontSize(16),
  },
  doneButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(30),
    borderRadius: scale(25),
    elevation: 2,
  },
  doneButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: responsiveFontSize(16),
  },
});

export default DiscoverScreen;
