import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, Platform } from 'react-native';
import { lightTheme, darkTheme } from '../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

// Helper function to detect system theme with multiple fallback methods
const detectSystemTheme = () => {
  try {
    // Method 1: Try Appearance.getColorScheme()
    let colorScheme = Appearance.getColorScheme();
    console.log('Method 1 - Appearance.getColorScheme():', colorScheme);
    
    if (colorScheme) {
      return colorScheme;
    }
    
    // Method 2: Try to get it from Appearance module directly
    if (Appearance.getColorScheme) {
      colorScheme = Appearance.getColorScheme();
      console.log('Method 2 - Direct call:', colorScheme);
      if (colorScheme) {
        return colorScheme;
      }
    }
    
    // Method 3: Check if we can detect through platform-specific methods
    if (Platform.OS === 'android') {
      // For Android, try to detect through other means
      console.log('Method 3 - Android fallback: using light as default');
      return 'light';
    } else if (Platform.OS === 'ios') {
      // For iOS, try to detect through other means
      console.log('Method 3 - iOS fallback: using light as default');
      return 'light';
    }
    
    // Final fallback
    console.log('All methods failed, using light as fallback');
    return 'light';
    
  } catch (error) {
    console.error('Error in system theme detection:', error);
    return 'light'; // fallback to light
  }
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Get the actual theme based on mode and system preference
  const getEffectiveTheme = (mode) => {
    if (mode === 'system') {
      const colorScheme = detectSystemTheme();
      return colorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  };

  const theme = getEffectiveTheme(themeMode);

  // Load theme preference from storage on initial load
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themePreference');
        console.log('Saved theme from storage:', savedTheme);
        
        const currentColorScheme = detectSystemTheme();
        console.log('Current system color scheme (detected):', currentColorScheme);
        
        if (savedTheme !== null) {
          setThemeMode(savedTheme);
          // Set initial isDark state based on saved theme
          if (savedTheme === 'system') {
            console.log('Saved theme is system, using current color scheme:', currentColorScheme);
            setIsDark(currentColorScheme === 'dark');
          } else {
            console.log('Saved theme is manual:', savedTheme);
            setIsDark(savedTheme === 'dark');
          }
        } else {
          // Set default isDark state for system mode
          console.log('No saved theme, defaulting to system mode with:', currentColorScheme);
          setIsDark(currentColorScheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Set default isDark state on error
        const colorScheme = detectSystemTheme();
        setIsDark(colorScheme === 'dark');
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Update isDark when themeMode changes
  useEffect(() => {
    console.log('Theme mode changed to:', themeMode);
    if (themeMode === 'system') {
      const colorScheme = detectSystemTheme();
      console.log('System color scheme (detected):', colorScheme);
      setIsDark(colorScheme === 'dark');
    } else {
      console.log('Setting manual theme - isDark:', themeMode === 'dark');
      setIsDark(themeMode === 'dark');
    }
  }, [themeMode]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (themeMode === 'system') {
      console.log('Setting up system theme listener');
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        console.log('System theme changed to:', colorScheme);
        // Force re-render when system theme changes
        setIsDark(colorScheme === 'dark');
      });
      return () => {
        console.log('Cleaning up system theme listener');
        subscription.remove();
      };
    }
  }, [themeMode]);

  // Save theme preference to storage when it changes
  const setTheme = async (newMode) => {
    console.log('Setting theme to:', newMode);
    setThemeMode(newMode);
    try {
      await AsyncStorage.setItem('themePreference', newMode);
      console.log('Theme preference saved successfully');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Keep toggleTheme for backward compatibility
  const toggleTheme = async () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setTheme(newMode);
  };

  if (isLoading) {
    return null; // or a loading indicator
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDark, 
      themeMode, 
      setTheme, 
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
