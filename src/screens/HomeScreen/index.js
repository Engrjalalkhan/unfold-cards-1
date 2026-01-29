import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TextInput, TouchableOpacity, LayoutAnimation, Platform, UIManager, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { zones, allSubcategories } from '../../data/decks';
import { getDateKey } from '../../utils/helpers';
import { CategoryCard } from '../../components/CategoryCard';
import { getMoodRecommendations, getRecommendedZones, isZoneRecommended } from '../../utils/moodRecommendations';
import { useTheme } from '../../contexts/ThemeContext';

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
  bgBackground: { backgroundColor: theme.colors.background },
  bgSurface: { backgroundColor: theme.colors.surface },
  bgSurfaceTint: { backgroundColor: theme.colors.surfaceTint },
  borderColor: { borderColor: theme.colors.border },
  shadowColor: { shadowColor: theme.colors.shadow },
  textPrimary: { color: theme.colors.text },
  textMuted: { color: theme.colors.textMuted },
});

function DailyQuestion({ onAnswer, theme }) {
  const dynamicStyles = getDynamicStyles(theme);
  
  // Get one random question for the entire day from all questions across all zones and subcategories
  const getDailyRandomQuestion = () => {
    const today = getDateKey(); // YYYY-MM-DD
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
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
    
    // Use hash to select the same question for the entire day
    const randomIndex = hash % allQuestions.length;
    return allQuestions[randomIndex];
  };

  const dailyQuestion = React.useMemo(() => getDailyRandomQuestion(), [getDateKey()]);
  
  if (!dailyQuestion) {
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
          <TouchableOpacity style={[styles.dailyQuestionBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.dailyQuestionBadgeText}>New</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.dailyQuestionText, dynamicStyles.textPrimary]}>
          {dailyQuestion.question}
        </Text>
        
        <View style={styles.dailyQuestionFooter}>
          <TouchableOpacity 
            style={[styles.dailyQuestionAnswerButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => onAnswer && onAnswer(dailyQuestion.category, dailyQuestion.questionIndex)}
          >
            <Text style={styles.dailyQuestionButtonText}>Answer Now</Text>
          </TouchableOpacity>
        </View>
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

export function HomeScreen({ profile, stats, currentMood, onSelectCategory, onAnswerDaily, onNavigateToNotifications, onViewAllQuestions, onNavigateToDiscover }) {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [expandedZoneId, setExpandedZoneId] = React.useState(null);
  const [todayKey, setTodayKey] = React.useState(getDateKey());
  const [query, setQuery] = React.useState('');

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
    <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Profile */}
        <View style={[styles.headerContainer, dynamicStyles.bgBackground]}>
          <View style={styles.profileSection}>
            {/* Removed avatar container with purple background circle as requested */}
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, dynamicStyles.textPrimary]}>
                Hi Friend
              </Text>
              <Text style={[styles.userStatus, dynamicStyles.textMuted]}>
                🔥 {stats?.streakDays ?? 1} day streak
              </Text>
            </View>
            <TouchableOpacity style={[styles.settingsButton, dynamicStyles.bgSurface]} onPress={onNavigateToNotifications}>
              <Ionicons name="notifications-outline" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Question Card */}
        <View style={styles.cardContainer}>
          <DailyQuestion key={todayKey} onAnswer={onAnswerDaily} theme={theme} />
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
          <TouchableOpacity style={[styles.quickActionCard, dynamicStyles.bgSurface, dynamicStyles.borderColor]}>
            <Ionicons name="heart" size={24} color={theme.colors.primary} />
            <Text style={[styles.quickActionText, dynamicStyles.textPrimary]}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickActionCard, dynamicStyles.bgSurface, dynamicStyles.borderColor]}>
            <Ionicons name="bar-chart" size={24} color={theme.colors.primary} />
            <Text style={[styles.quickActionText, dynamicStyles.textPrimary]}>Progress</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, dynamicStyles.bgSurfaceTint, dynamicStyles.borderColor]}>
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
    backgroundColor: 'transparent',
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
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
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
    marginHorizontal: 4,
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
    alignItems: 'center',
  },
  dailyQuestionAnswerButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    minWidth: 140,
  },
  dailyQuestionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
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
});
