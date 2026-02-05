import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { zones, allSubcategories } from '../../data/decks';
import { getDateKey } from '../../utils/helpers';
import { CategoryCard } from '../../components/CategoryCard';
import { getMoodRecommendations, getRecommendedZones, isZoneRecommended } from '../../utils/moodRecommendations';
import { useTheme } from '../../contexts/ThemeContext';
import { StreakManager } from '../../utils/streakManager';

// Helper function to get time of day
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

// Helper function to get zone-specific icons
const getZoneIcon = (zoneId) => {
  const iconMap = {
    'relationship-zone': 'heart',
    'friendship-zone': 'people',
    'family-zone': 'home',
    'emotional-zone': 'water',
    'fun-zone': 'game-controller'
  };
  return iconMap[zoneId] || 'albums-outline';
};

const getDynamicStyles = (theme) => ({
  bgBackground: { backgroundColor: '#FFFFFF' }, // Force white background
  bgSurface: { backgroundColor: '#FFFFFF' }, // Force white surface
  bgSurfaceTint: { backgroundColor: '#FFFFFF' }, // Force white surface tint
  borderColor: { borderColor: '#E6D6FF' }, // Use consistent border color
  shadowColor: { shadowColor: '#7A6FA3' }, // Use consistent shadow color
  textPrimary: { color: theme.colors.text },
  textMuted: { color: theme.colors.textMuted },
});

function DailyQuestion({ onAnswer, theme, onNavigateToDiscover, setStreakDays }) {
  const dynamicStyles = getDynamicStyles(theme);
  const [expandedAnswer, setExpandedAnswer] = React.useState(false);
  const [answerText, setAnswerText] = React.useState('');
  const [savedAnswer, setSavedAnswer] = React.useState('');
  const [currentQuestion, setCurrentQuestion] = React.useState(null);
  const [questionSeed, setQuestionSeed] = React.useState(0);
  
  // Get one random question from all questions across all zones and subcategories
  const getRandomQuestion = (seed = 0) => {
    // Collect all questions from all subcategories
    const allQuestions = [];
    allSubcategories.forEach(subcategory => {
      if (subcategory.questions && Array.isArray(subcategory.questions)) {
        subcategory.questions.forEach((question, index) => {
          allQuestions.push({
            question: question,
            category: subcategory,
            questionIndex: index
          });
        });
      }
    });
    
    // Use seed to select a question (for consistent daily question or random for "New" button)
    const randomIndex = seed > 0 ? seed % allQuestions.length : Math.floor(Math.random() * allQuestions.length);
    return allQuestions[randomIndex];
  };

  // Get daily question (consistent for the day)
  const getDailyRandomQuestion = () => {
    const today = getDateKey(); // YYYY-MM-DD
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return getRandomQuestion(hash);
  };

  // Initialize with daily question
  React.useEffect(() => {
    const dailyQuestion = getDailyRandomQuestion();
    setCurrentQuestion(dailyQuestion);
    setQuestionSeed(0); // Reset seed for daily question
  }, [getDateKey()]);
  
  const handleAnswerPress = () => {
    setExpandedAnswer(!expandedAnswer);
    if (!expandedAnswer) {
      setAnswerText(savedAnswer || '');
    }
  };

  // Handle "New" button click - get a random question
  const handleNewQuestion = () => {
    const newSeed = Date.now(); // Use timestamp as seed for randomness
    const newQuestion = getRandomQuestion(newSeed);
    setCurrentQuestion(newQuestion);
    setQuestionSeed(newSeed);
    setSavedAnswer(''); // Clear saved answer for new question
    setAnswerText(''); // Clear input
    setExpandedAnswer(false); // Close answer section
  };
  
  const handleSubmitAnswer = async () => {
    if (answerText.trim() && currentQuestion) {
      try {
        // Clear input immediately for better UX
        const currentAnswer = answerText.trim();
        setAnswerText('');
        
        // Save to Discover screen submissions
        const existingSubmissions = await AsyncStorage.getItem('discoverSubmissions');
        const submissions = existingSubmissions ? JSON.parse(existingSubmissions) : [];
        
        // Check if this question already exists (for daily questions, update instead of duplicate)
        const existingIndex = submissions.findIndex(
          item => item.question === currentQuestion.question && item.type === 'daily'
        );
        
        const newSubmission = {
          id: `daily-${Date.now()}`,
          question: currentQuestion.question,
          answer: currentAnswer,
          category: currentQuestion.category,
          categoryId: currentQuestion.categoryId,
          color: currentQuestion.color || '#8B5CF6',
          type: 'daily',
          timestamp: new Date().toISOString(),
          mood: 'Daily Question', // Add mood for consistency with mood questions
          isRandomQuestion: questionSeed > 0 // Flag to indicate if this was a random question
        };
        
        if (existingIndex >= 0) {
          // Update existing submission
          submissions[existingIndex] = newSubmission;
          console.log('Updated existing daily submission in Discover screen');
        } else {
          // Add new submission
          submissions.push(newSubmission);
          console.log('Added new daily submission to Discover screen');
        }
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('discoverSubmissions', JSON.stringify(submissions));
        
        // Clear input and update UI
        setSavedAnswer(currentAnswer);
        setExpandedAnswer(false);
        
        console.log('✅ Daily question and answer successfully saved to Discover screen:', {
          question: newSubmission.question,
          answer: newSubmission.answer,
          type: newSubmission.type,
          isRandomQuestion: newSubmission.isRandomQuestion,
          totalSubmissions: submissions.length
        });
        
        // Navigate to Discover screen to show the newly added submission
        if (onNavigateToDiscover) {
          console.log('🔄 Navigating to Discover screen...');
          onNavigateToDiscover();
        }
      } catch (error) {
        console.error('Error saving daily answer:', error);
        // Restore the answer text if there was an error
        setAnswerText(answerText);
      }
    }
  };

  // Handle sharing question - this is where streak is updated
  const handleShareQuestion = async () => {
    try {
      // Update streak when sharing question
      const newStreak = await StreakManager.updateStreak();
      setStreakDays(newStreak);
      
      console.log('✅ Streak updated to:', newStreak, 'after sharing question');
      
      // Share the question text
      const shareText = `🤔 Question of the Day: ${currentQuestion.question}`;
      
      // Use React Native's Share functionality if available, or fallback to clipboard
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: 'Question of the Day',
            text: shareText,
          });
          console.log('Question shared successfully');
        } catch (shareError) {
          console.log('Share cancelled or failed:', shareError);
          // Fallback to clipboard
          await copyToClipboard(shareText);
        }
      } else {
        // Fallback to clipboard
        await copyToClipboard(shareText);
      }
    } catch (error) {
      console.error('Error sharing question:', error);
    }
  };

  // Helper function to copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        console.log('Question copied to clipboard');
        // You could show a toast message here
      } else {
        console.log('Clipboard not available');
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };
  
  if (!currentQuestion) {
    return null; // Fallback if no questions available
  }

  return (
    <View style={[styles.dailyQuestionCard, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: theme.colors.border }]}>
      <LinearGradient
        style={[styles.dailyQuestionGradient, { borderRadius: 20 }]}
        colors={[theme.colors.primary + '10', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.dailyQuestionContent}>
        <View style={styles.dailyQuestionHeader}>
          <View style={styles.dailyQuestionTitleContainer}>
            <Image 
              source={require('../../../assets/questiondayicon.png')} 
              style={styles.dailyQuestionIcon}
              resizeMode="contain"
            />
            <Text style={[styles.dailyQuestionTitle, dynamicStyles.textPrimary]}>Question of the Day</Text>
          </View>
          <TouchableOpacity 
            style={[styles.dailyQuestionBadge, { backgroundColor: theme.colors.primary }]}
            onPress={handleNewQuestion}
          >
            <Text style={styles.dailyQuestionBadgeText}>New</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.dailyQuestionText, dynamicStyles.textPrimary]}>
          {currentQuestion.question}
        </Text>
        
        <View style={styles.dailyQuestionFooter}>
          <View style={styles.answerButtonContainer}>
            <TouchableOpacity 
              style={[styles.dailyQuestionAnswerButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAnswerPress}
            >
              <Text style={styles.dailyQuestionButtonText}>
                {expandedAnswer ? 'Close' : 'Answer Now'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.dailyQuestionShareButton, { backgroundColor: theme.colors.secondary }]}
            onPress={handleShareQuestion}
          >
            <Ionicons name="share-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Answer Section */}
        {expandedAnswer && (
          <View style={[styles.answerSection, { alignItems: 'center' }]}>
            {savedAnswer && !answerText && (
              <View style={[styles.savedAnswer, { alignItems: 'center' }]}>
                <Text style={styles.savedAnswerLabel}>Your answer:</Text>
                <Text style={styles.savedAnswerText}>{savedAnswer}</Text>
              </View>
            )}
            
            <TextInput
              style={[styles.answerInput, { textAlign: 'center' }]}
              multiline
              placeholder="Share your thoughts..."
              placeholderTextColor="#999"
              value={answerText}
              onChangeText={setAnswerText}
              textAlignVertical="center"
              autoFocus
            />
            
            <TouchableOpacity 
              style={[styles.submitButton, !answerText.trim() && styles.disabledButton, { alignSelf: 'center' }]}
              onPress={handleSubmitAnswer}
              disabled={!answerText.trim()}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function MoodRecommendations({ currentMood, theme }) {
  if (!currentMood || typeof currentMood !== 'string') return null;
  
  const moodData = getMoodRecommendations(currentMood);
  
  // Additional safety check
  if (!moodData || !moodData.quote || !moodData.suggestedQuestions) {
    return null;
  }
  
  return (
    <View style={[styles.moodCard, { borderColor: theme.colors.primary }]}>
      <View style={styles.moodHeader}>
        <Text style={[styles.moodTitle, { color: theme.colors.text }]}>
          Based on your mood: {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
        </Text>
      </View>
      
      <Text style={[styles.moodQuote, { color: theme.colors.textMuted }]}>
        "{moodData.quote}"
      </Text>
      
      <View style={styles.moodSuggestions}>
        <Text style={[styles.moodSuggestionsTitle, { color: theme.colors.text }]}>
          Suggested questions for you:
        </Text>
        {moodData.suggestedQuestions.slice(0, 3).map((question, index) => (
          <Text key={index} style={[styles.moodSuggestion, { color: theme.colors.textMuted }]}>
            • {question}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function HomeScreen({ profile, stats, currentMood, onSelectCategory, onAnswerDaily, onNavigateToNotifications, onViewAllQuestions, onNavigateToDiscover, onNavigateToFavorites, onNavigateToProgress }) {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expandedZoneId, setExpandedZoneId] = React.useState(null);
  const [todayKey, setTodayKey] = React.useState(getDateKey());
  const [query, setQuery] = React.useState('');
  const [streakDays, setStreakDays] = React.useState(0);

  // Load streak data on mount
  React.useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const { streakDays } = await StreakManager.getStreakData();
      setStreakDays(streakDays);
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  // Function to navigate to AllQuestionsScreen
  const handleViewAllQuestions = () => {
    console.log('handleViewAllQuestions called');
    try {
      console.log('Attempting to navigate to AllQuestionsScreen...');
      navigation.navigate('AllQuestions');
      console.log('Navigation call completed');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  React.useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  React.useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const ms = next - now;
    const t = setTimeout(() => setTodayKey(getDateKey()), ms);
    return () => clearTimeout(t);
  }, [todayKey]);

  const toggleZone = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedZoneId((prev) => (prev === id ? null : id));
  };

  const dynamicStyles = getDynamicStyles(theme);
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: '#FFFFFF' }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { backgroundColor: '#FFFFFF', paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Profile - Responsive with SafeArea */}
        <View style={[
          styles.headerContainer, 
          { 
            backgroundColor: '#FFFFFF',
            paddingTop: insets.top + 16 
          }
        ]}>
          <View style={styles.profileSection}>
            {/* Removed avatar container with purple background circle as requested */}
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, dynamicStyles.textPrimary]}>
                Hi Friend
              </Text>
              <Text style={[styles.userStatus, dynamicStyles.textMuted]}>
                🔥 {streakDays} day streak
              </Text>
            </View>
            <TouchableOpacity style={[styles.settingsButton, dynamicStyles.bgSurface]} onPress={onNavigateToNotifications}>
              <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Question Card */}
        <View style={styles.cardContainer}>
          <DailyQuestion 
            key={todayKey} 
            onAnswer={onAnswerDaily} 
            theme={theme} 
            onNavigateToDiscover={onNavigateToDiscover}
            setStreakDays={setStreakDays}
          />
        </View>

        {/* Mood Recommendations */}
        <MoodRecommendations currentMood={currentMood} theme={theme} />

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={[styles.quickActionCard, dynamicStyles.bgSurface, dynamicStyles.borderColor]}
            onPress={onNavigateToDiscover}
          >
            <Ionicons name="sparkles" size={24} color={theme.colors.primary} />
            <Text style={[styles.quickActionText, dynamicStyles.textPrimary]}>Discover</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionCard, dynamicStyles.bgSurface, dynamicStyles.borderColor]}
            onPress={onNavigateToFavorites}
          >
            <Ionicons name="heart" size={24} color={theme.colors.primary} />
            <Text style={[styles.quickActionText, dynamicStyles.textPrimary]}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionCard, dynamicStyles.bgSurface, dynamicStyles.borderColor]} onPress={onNavigateToProgress}>
            <Ionicons name="bar-chart" size={24} color={theme.colors.primary} />
            <Text style={[styles.quickActionText, dynamicStyles.textPrimary]}>Progress</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: '#FFFFFF' }, dynamicStyles.borderColor]}>
            <Ionicons name="search-outline" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search zones or questions..."
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.searchInput, { color: theme.colors.text }]}
            />
          </View>
        </View>

        {/* Zones Section */}
        <View style={styles.zonesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, dynamicStyles.textPrimary]}>Explore Zones</Text>
            <TouchableOpacity onPress={handleViewAllQuestions}>
              <Text style={[styles.viewAllText, { color: '#0066CC' }]}>View all</Text>
            </TouchableOpacity>
          </View>

          {(function() {
            const q = query.trim().toLowerCase();
            const displayed = zones.map((zone) => {
              const filteredSubcategories = q
                ? zone.subcategories.filter((c) =>
                    (c.name || '').toLowerCase().includes(q) || (zone.name || '').toLowerCase().includes(q)
                  )
                : zone.subcategories;
              return {
                id: zone.id,
                name: zone.name,
                color: zone.color,
                subcategories: filteredSubcategories
              };
            }).filter((z) => z.subcategories && z.subcategories.length > 0);
            return displayed;
          })().map((zone) => {
            const expanded = expandedZoneId === zone.id;
            const isRecommended = currentMood && isZoneRecommended(zone.id, currentMood);
            
            return (
              <View key={zone.id} style={styles.zoneContainer}>
                <TouchableOpacity
                  style={[styles.zoneCard, dynamicStyles.bgSurface, dynamicStyles.borderColor, dynamicStyles.shadowColor]}
                  onPress={() => toggleZone(zone.id)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    style={[styles.zoneGradient, { borderRadius: 20 }]}
                    colors={[zone.color + '15', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  
                  <View style={styles.zoneContent}>
                    <View style={styles.zoneHeader}>
                      <View style={[styles.zoneIcon, { backgroundColor: zone.color }]}>
                        <Ionicons name={getZoneIcon(zone.id)} size={24} color="#FFFFFF" />
                      </View>
                      <View style={styles.zoneInfo}>
                        <Text style={[styles.zoneName, dynamicStyles.textPrimary]}>{zone.name}</Text>
                        <Text style={[styles.zoneCount, dynamicStyles.textMuted]}>
                          {zone.subcategories.length} subcategories
                        </Text>
                      </View>
                      {isRecommended && (
                        <View style={[styles.recommendedBadge, { backgroundColor: theme.colors.primary }]}>
                          <Text style={styles.recommendedText}>Recommended</Text>
                        </View>
                      )}
                      <Ionicons 
                        name={expanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={theme.colors.textMuted} 
                      />
                    </View>
                    
                    {!expanded && zone.previewQuestions && zone.previewQuestions.length > 0 && (
                      <View style={styles.previewSection}>
                        {zone.previewQuestions.slice(0, 3).map((question, index) => (
                          <Text key={index} style={[styles.previewQuestion, dynamicStyles.textMuted]}>
                            • {question.length > 50 ? question.substring(0, 50) + '...' : question}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded Subcategories */}
                {expanded && (
                  <View style={styles.subcategoriesContainer}>
                    {zone.subcategories.map((subcategory) => (
                      <CategoryCard
                        key={subcategory.id}
                        category={subcategory}
                        onPress={() => onSelectCategory(subcategory)}
                        theme={theme}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    // paddingTop is now set dynamically with safe area insets
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 14,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  cardContainer: {
    marginBottom: 20,
  },
  dailyQuestionSection: {
    marginBottom: 24,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  questionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  questionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    backgroundColor: '#FFFFFF',
    padding: 0,
    overflow: 'hidden',
    // Enhanced shadow for iOS
    shadowColor: '#7A6FA3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    // Enhanced elevation for Android
    elevation: 10,
  },
  questionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  questionContent: {
    padding: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20,
    lineHeight: 24,
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  questionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  questionShareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  focusSection: {
    marginBottom: 24,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  focusTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  focusAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  focusActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  focusCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    backgroundColor: '#FFFFFF',
    padding: 0,
    overflow: 'hidden',
    // Enhanced shadow for iOS
    shadowColor: '#7A6FA3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Enhanced elevation for Android
    elevation: 6,
  },
  focusGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  focusContent: {
    padding: 20,
  },
  focusQuestion: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 24,
  },
  focusSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  focusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  focusStat: {
    alignItems: 'center',
  },
  focusStatNumber: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  focusStatLabel: {
    fontSize: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionCard: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    // Shadow for quick action cards
    shadowColor: '#7A6FA3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  zonesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  zoneContainer: {
    marginBottom: 16,
  },
  zoneCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  zoneGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  zoneContent: {
    padding: 20,
  },
  zoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  zoneCount: {
    fontSize: 14,
  },
  recommendedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  previewSection: {
    marginTop: 8,
  },
  previewQuestion: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  subcategoriesContainer: {
    marginTop: 8,
    paddingLeft: 20,
  },
  // Legacy styles for compatibility
  headerSection: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  greetingContainer: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
  },
  brandHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  heroTitle: { color: '#2F2752', fontSize: 32, fontWeight: '800', marginBottom: 10 },
  panel: { backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: '#E6D6FF', padding: 16, shadowColor: 'rgba(124,77,255,0.18)', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14 },
  searchRow: { marginTop: 12, marginBottom: 16 },
  zoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  zoneBadge: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  zoneHeaderTitle: { color: '#2F2752', fontSize: 18, fontWeight: '700', flex: 1 },
  zoneChevron: { color: '#7A6FA3', fontSize: 22 },
  zoneChevronOpen: { transform: [{ rotate: '90deg' }] },
  subcategoriesList: { paddingHorizontal: 14, paddingBottom: 12 },
  footerNote: { paddingHorizontal: 16, paddingTop: 8 },
  footerText: { color: '#7A6FA3', fontSize: 13 },
  dailyCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6D6FF',
    shadowColor: 'rgba(124,77,255,0.18)',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  dailyTitle: { color: '#3B245A', fontSize: 16, fontWeight: '700' },
  dailyPrompt: { color: '#2F2752', fontSize: 16, marginTop: 6 },
  dailyQuestionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dailyQuestionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dailyQuestionContent: {
    padding: 24,
  },
  dailyQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dailyQuestionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyQuestionIcon: {
    width: 35,
    height: 35,
    marginRight: 8,
  },
  dailyQuestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  dailyQuestionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyQuestionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  dailyQuestionText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 24,
    lineHeight: 24,
  },
  dailyQuestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  answerButtonContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dailyQuestionAnswerButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    minWidth: 160,
  },
  dailyQuestionShareButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    position: 'absolute',
    right: 0,
  },
  dailyQuestionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  dailyQuestionShareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  moodCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: 'rgba(124,77,255,0.18)',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  moodHeader: {
    marginBottom: 12,
  },
  moodTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  moodQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 20,
  },
  moodSuggestions: {
    marginTop: 8,
  },
  moodSuggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  moodSuggestion: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  answerSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  savedAnswer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
  },
  savedAnswerLabel: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 4,
  },
  savedAnswerText: {
    fontSize: 14,
    color: '#2F2752',
    lineHeight: 20,
  },
  answerInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2F2752',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    minHeight: 80,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
