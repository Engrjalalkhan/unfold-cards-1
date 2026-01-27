import React, { useState, useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import theme and context
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { lightTheme, darkTheme } from './src/theme/theme';

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

const Tab = createBottomTabNavigator();

const AppContent = () => {
  const { theme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showMoodMeter, setShowMoodMeter] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const navigationRef = React.useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [favorites, setFavorites] = useState([]);

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
  }, []);

  useEffect(() => {
    if (activeTab === 'Favorites') {
      loadFavorites();
    }
  }, [activeTab]);

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
      } else {
        console.log('No favorites found in storage');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
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
      onNavigateToNotifications={() => console.log('Navigate to notifications')}
      onViewAllQuestions={handleViewAllQuestions}
      onNavigateToDiscover={() => console.log('Navigate to discover')}
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
          onBack={() => {
            console.log('Back button pressed in CategoryQuestions');
            setSelectedCategory(null);
            navigationRef.current?.navigate('Home');
          }}
          onToggleFavorite={(category, question) => console.log('Toggle favorite:', category.name, question)}
          isFavorite={(categoryId, question) => false}
          onShareQuestion={(question) => console.log('Share question:', question)}
        />
      );
    },
    AllQuestionsScreen: ({ navigation, route }) => {
      return (
        <AllQuestionsScreen 
          navigation={navigation} 
          route={route}
          onToggleFavorite={(category, question) => console.log('Toggle favorite:', category.name, question)}
          isFavorite={(categoryId, question) => false}
        />
      );
    },
    MoodQuestions: ({ navigation, route }) => {
      return <MoodQuestionsScreen navigation={navigation} route={route} />;
    },
    SubcategoryQuestions: ({ navigation, route }) => {
      return <SubcategoryQuestionsScreen navigation={navigation} route={route} />;
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
                detailed[key].read = item.read;
                await AsyncStorage.setItem('detailedFavorites', JSON.stringify(detailed));
                
                // Update state to refresh the UI
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
      profile={{}}
      setProfile={() => console.log('Set profile')}
      favoritesCount={0}
      stats={{}}
      favorites={[]}
      onViewAllFavorites={() => console.log('View all favorites')}
      onEnableNotifications={() => console.log('Enable notifications')}
      onSignOut={() => console.log('Sign out')}
      onBack={handleBackToHome}
    />,
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
              } else if (route.name === 'Shuffle') {
                iconName = 'shuffle';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
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
                tabBarButton: name === 'CategoryQuestions' || name === 'AllQuestionsScreen' || name === 'MoodQuestions' || name === 'SubcategoryQuestions' ? () => null : undefined,
                tabBarItemStyle: name === 'CategoryQuestions' || name === 'AllQuestionsScreen' || name === 'MoodQuestions' || name === 'SubcategoryQuestions' ? { display: 'none' } : undefined
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
});

export default App;