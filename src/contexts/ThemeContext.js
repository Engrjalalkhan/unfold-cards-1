import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, Platform } from 'react-native';
import { lightTheme, darkTheme } from '../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
  const [isLoading, setIsLoading] = useState(true);

  // Get the actual theme based on mode and system preference
  const getEffectiveTheme = (mode) => {
    if (mode === 'system') {
      const colorScheme = Appearance.getColorScheme();
      return colorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  };

  const isDark = getEffectiveTheme(themeMode) === darkTheme;
  const theme = getEffectiveTheme(themeMode);

  // Load theme preference from storage on initial load
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme !== null) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (themeMode === 'system') {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => {
        // Force re-render when system theme changes
        setIsDark(colorScheme === 'dark');
      });
      return () => subscription.remove();
    }
  }, [themeMode]);

  // Save theme preference to storage when it changes
  const setTheme = async (newMode) => {
    setThemeMode(newMode);
    try {
      await AsyncStorage.setItem('themePreference', newMode);
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
    <ThemeContext.Provider value={{ theme, isDark, themeMode, setTheme, toggleTheme }}>
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
