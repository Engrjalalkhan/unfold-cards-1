import React, { useState, useEffect } from 'react';
import { StatusBar, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import theme and context
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { lightTheme, darkTheme } from './src/theme/theme';
import { StatsManager } from './src/utils/statsManager';

// Import screens
import SplashScreen from './src/components/SplashScreen';
import { CarouselOnboardingScreen } from './src/screens/CarouselOnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CategoryQuestionsScreen } from './src/screens/CategoryQuestionsScreen';
import AllQuestionsScreen from './src/screens/AllQuestionsScreen';
import { MoodMeter } from './src/screens/MoodMeter';
import MoodQuestionsScreen from './src/screens/MoodQuestionsScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { ShuffleScreen } from './src/screens/ShuffleScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SubcategoryQuestionsScreen } from './src/screens/SubcategoryQuestionsScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { DarkModeScreen } from './src/screens/DarkModeScreen';

const Tab = createBottomTabNavigator();

const AppContent = () => {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMoodMeter, setShowMoodMeter] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const navigationRef = React.useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [profile, setProfile] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [unreadFavoritesCount, setUnreadFavoritesCount] = useState(0);
  const [stats, setStats] = useState({});

  // Load profile data on mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        console.log('=== LOADING PROFILE DATA ===');
        const savedProfileData = await AsyncStorage.getItem('USER_PROFILE_DATA');
        console.log('Raw savedProfileData:', savedProfileData);
        if (savedProfileData) {
          const profileData = JSON.parse(savedProfileData);
          console.log('Parsed profileData:', profileData);
          setProfile(profileData);
          console.log('Profile state set to:', profileData);
        } else {
          console.log('No saved profile data found, using default');
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };
    loadProfileData();
  }, []);

  const handleNavigateToFavorites = () => {
    // Navigate to Favorites screen
    if (navigationRef.current) {
      navigationRef.current.navigate('Favorites');
    }
  };

  const handleNavigateToDiscover = () => {
    // Navigate to Discover screen
    if (navigationRef.current) {
      navigationRef.current.navigate('Discover');
    }
  };

  const handleNavigateToNotifications = () => {
    // Navigate to Notifications screen
    if (navigationRef.current) {
      navigationRef.current.navigate('Notifications');
    }
  };

  const handleNavigateToProgress = () => {
    // Navigate to Progress screen
    if (navigationRef.current) {
      navigationRef.current.navigate('Progress');
    }
  };

  const handleNavigateToDarkMode = () => {
    // Navigate to DarkMode screen
    if (navigationRef.current) {
      navigationRef.current.navigate('DarkMode');
    }
  };

  const handleViewAllQuestions = () => {
    // Navigate to AllQuestions screen
    if (navigationRef.current) {
      navigationRef.current.navigate('AllQuestions');
    }
  };

  const handleBackToHome = () => {
    setActiveTab('Home');
    setSelectedCategory(null);
    if (navigationRef.current) {
      navigationRef.current.navigate('Home');
    }
  };

  const handleSelectCategory = (category) => {
    console.log('Category selected:', category.name, 'with', category.questions.length, 'questions');
    setSelectedCategory(category);
    // Navigate to CategoryQuestions screen
    if (navigationRef.current) {
      console.log('Navigating to CategoryQuestions screen...');
      navigationRef.current.navigate('CategoryQuestions');
    } else {
      console.log('Navigation ref is not available');
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setShowOnboarding(false);
      setShowMoodMeter(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleMoodSelect = (mood) => {
    setShowMoodMeter(false);
    // Navigate to MoodQuestionsScreen with the selected mood
    if (navigationRef.current) {
      navigationRef.current.navigate('MoodQuestions', { mood });
    }
  };

  const handleToggleFavorite = async (category, question) => {
    console.log('Toggle favorite for question:', question, 'in category:', category.name);
    try {
      // Get existing favorites
      const detailedFavorites = await AsyncStorage.getItem('detailedFavorites');
      const detailed = detailedFavorites ? JSON.parse(detailedFavorites) : {};
      
      const key = `${category.id}-${question}`;
      
      if (detailed[key]) {
        // Remove from favorites
        delete detailed[key];
        console.log('Removed from favorites:', key);
      } else {
        // Add to favorites
        detailed[key] = {
          categoryId: category.id,
          categoryName: category.name,
          question: question,
          color: category.color || '#8B5CF6',
          read: false,
          timestamp: new Date().toISOString()
        };
        console.log('Added to favorites:', key);
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('detailedFavorites', JSON.stringify(detailed));
      
      // Update state
      loadFavorites();
      
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleIsFavorite = (categoryId, question) => {
    // Check if item is in favorites
    const key = `${categoryId}-${question}`;
    return favorites.some(fav => 
      fav.categoryId === categoryId && fav.question === question
    );
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Always show onboarding for this test
        // In a real app, you would check AsyncStorage
        const timer = setTimeout(() => {
          setIsLoading(false);
          setShowOnboarding(true);
        }, 2000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error:', error);
        setIsLoading(false);
        setShowOnboarding(true);
      }
    };

    checkOnboarding();
    loadFavorites();
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'Favorites') {
      loadFavorites();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      const currentStats = await StatsManager.getStats();
      setStats(currentStats);
      console.log('Stats loaded:', currentStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      console.log('Loading favorites from storage...');
      const detailedFavorites = await AsyncStorage.getItem('detailedFavorites');
      console.log('Detailed favorites from storage:', detailedFavorites);
      if (detailedFavorites) {
        const favData = JSON.parse(detailedFavorites);
        const favArray = Object.values(favData);
        console.log('Parsed favorites array:', favArray);
        setFavorites(favArray);
        
        // Calculate unread favorites count for badge
        const unreadCount = favArray.filter(fav => !fav.read).length;
        setUnreadFavoritesCount(unreadCount);
        console.log('Unread favorites count:', unreadCount);
      } else {
        console.log('No favorites found in storage');
        setFavorites([]);
        setUnreadFavoritesCount(0);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
      setUnreadFavoritesCount(0);
    }
  };

  // Show splash screen while loading
  if (isLoading) {
    return <SplashScreen />;
  }

  // Show onboarding after splash
  if (showOnboarding) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <CarouselOnboardingScreen 
          onContinue={handleOnboardingComplete}
        />
      </View>
    );
  }

  // Main app with bottom tab navigation
  // Create navigation theme based on current theme
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  const combinedTheme = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      ...(isDark ? darkTheme.colors : lightTheme.colors),
    },
  };

  // Create screen components with theme
  const screens = {
    Home: () => <HomeScreen 
      theme={theme} 
      onSelectCategory={handleSelectCategory}
      onAnswerDaily={() => console.log('Daily question answered')}
      onNavigateToNotifications={handleNavigateToNotifications}
      onViewAllQuestions={handleViewAllQuestions}
      onNavigateToDiscover={handleNavigateToDiscover}
      onNavigateToFavorites={handleNavigateToFavorites}
      onNavigateToProgress={handleNavigateToProgress}
    />,
    CategoryQuestions: () => {
      console.log('CategoryQuestions screen rendering, selectedCategory:', selectedCategory?.name);
      if (!selectedCategory) {
        console.log('No selected category, returning null');
        return null;
      }
      return (
        <CategoryQuestionsScreen 
          category={selectedCategory}
          favorites={favorites}
          onBack={() => {
            console.log('Back button pressed in CategoryQuestions');
            setSelectedCategory(null);
            navigationRef.current?.navigate('Home');
          }}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={handleIsFavorite}
          onShareQuestion={(question) => console.log('Share question:', question)}
        />
      );
    },
    AllQuestions: ({ navigation, route }) => {
      return (
        <AllQuestionsScreen 
          navigation={navigation} 
          route={route}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={handleIsFavorite}
          onShareQuestion={(question) => console.log('Share question:', question)}
        />
      );
    },
    MoodQuestions: ({ navigation, route }) => {
      return <MoodQuestionsScreen navigation={navigation} route={route} />;
    },
    Favorites: () => {
      console.log('Rendering Favorites screen with items:', favorites);
      return (
        <FavoritesScreen 
          items={favorites}
          onOpen={() => console.log('Open favorite')}
          onRemove={async (item) => {
            console.log('Removing favorite:', item);
            try {
              const detailedFavorites = await AsyncStorage.getItem('detailedFavorites');
              const detailed = detailedFavorites ? JSON.parse(detailedFavorites) : {};
              const key = `${item.categoryId}-${item.question}`;
              delete detailed[key];
              await AsyncStorage.setItem('detailedFavorites', JSON.stringify(detailed));
              
              // Also update the simple favorites set
              const simpleFavorites = await AsyncStorage.getItem('favorites');
              if (simpleFavorites) {
                const favArray = JSON.parse(simpleFavorites);
                const updatedArray = favArray.filter(fav => fav !== key);
                await AsyncStorage.setItem('favorites', JSON.stringify(updatedArray));
              }
              
              // Update state
              loadFavorites();
            } catch (error) {
              console.error('Error removing favorite:', error);
            }
          }}
          onBack={handleBackToHome}
          onShareQuestion={(question) => console.log('Share question:', question)}
          onToggleRead={async (item) => {
            console.log('Toggling read status:', item);
            try {
              const detailedFavorites = await AsyncStorage.getItem('detailedFavorites');
              const detailed = detailedFavorites ? JSON.parse(detailedFavorites) : {};
              const key = `${item.categoryId}-${item.question}`;
              
              if (detailed[key]) {
                // Just update the read status, don't remove from favorites
                detailed[key].read = item.read;
                await AsyncStorage.setItem('detailedFavorites', JSON.stringify(detailed));
                
                // Update state to refresh the UI and badge count
                loadFavorites();
              }
            } catch (error) {
              console.error('Error toggling read status:', error);
            }
          }}
        />
      );
    },
    Shuffle: () => <ShuffleScreen 
      onOpen={(category, index) => console.log('Open category:', category, 'at index:', index)}
      onBack={handleBackToHome}
      onShareQuestion={(question) => console.log('Share question:', question)}
    />,
    Profile: () => <ProfileScreen 
      profile={profile}
      setProfile={setProfile}
      favoritesCount={favorites.length}
      stats={stats}
      favorites={favorites}
      onViewAllFavorites={handleNavigateToFavorites}
      onEnableNotifications={() => console.log('Enable notifications')}
      onSignOut={() => console.log('Sign out')}
      onBack={handleBackToHome}
      onNavigateToDarkMode={handleNavigateToDarkMode}
    />,
    Discover: ({ navigation, route }) => {
      return <DiscoverScreen navigation={navigation} route={route} onBack={handleBackToHome} />;
    },
    Notifications: ({ navigation, route }) => {
      return <NotificationsScreen navigation={navigation} route={route} onBack={handleBackToHome} />;
    },
    Progress: ({ navigation, route }) => {
      return <ProgressScreen navigation={navigation} route={route} onBack={handleBackToHome} />;
    },
    DarkMode: ({ navigation, route }) => {
      return <DarkModeScreen navigation={navigation} route={route} onBack={handleBackToHome} />;
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={combinedTheme} ref={navigationRef}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Favorites') {
                iconName = focused ? 'heart' : 'heart-outline';
                // Add badge for favorites count
                return (
                  <View style={styles.iconContainer}>
                    <Ionicons name={iconName} size={size} color={color} />
                    {unreadFavoritesCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadFavoritesCount}</Text>
                      </View>
                    )}
                  </View>
                );
              } else if (route.name === 'Shuffle') {
                iconName = 'shuffle';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              } else if (route.name === 'Discover') {
                iconName = focused ? 'compass' : 'compass-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            headerShown: false,
          })}
          listeners={{
            tabPress: (e) => {
              setActiveTab(e.target);
            },
          }}
        >
          {Object.entries(screens).map(([name, component]) => (
            <Tab.Screen 
              key={name} 
              name={name} 
              component={component}
              options={{ 
                tabBarLabel: name.toUpperCase(),
                tabBarButton: name === 'CategoryQuestions' || name === 'AllQuestions' || name === 'MoodQuestions' || name === 'SubcategoryQuestions' || name === 'Discover' || name === 'Notifications' || name === 'Progress' || name === 'DarkMode' ? () => null : undefined,
                tabBarItemStyle: name === 'CategoryQuestions' || name === 'AllQuestions' || name === 'MoodQuestions' || name === 'SubcategoryQuestions' || name === 'Discover' || name === 'Notifications' || name === 'Progress' || name === 'DarkMode' ? { display: 'none' } : undefined
              }}
            />
          ))}
        </Tab.Navigator>
      </NavigationContainer>
      
      {/* Mood Meter Modal */}
      {showMoodMeter && (
        <MoodMeter onSelect={handleMoodSelect} />
      )}
    </View>
  );
};

// Wrap the main app with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;