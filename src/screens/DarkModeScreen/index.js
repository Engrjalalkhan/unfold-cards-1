import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';

const getDynamicStyles = (theme, isDark) => ({
  bgBackground: { backgroundColor: isDark ? '#000000' : theme.colors.background },
  bgSurface: { backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface },
  textPrimary: { color: isDark ? '#FFFFFF' : theme.colors.text },
  textMuted: { color: isDark ? '#A0A0A0' : theme.colors.textMuted },
  settingsCard: {
    backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface,
    borderColor: isDark ? '#333' : theme.colors.border,
    shadowColor: isDark ? '#000' : theme.colors.shadow,
  },
  optionCard: {
    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
    borderColor: isDark ? '#444' : theme.colors.border,
    shadowColor: isDark ? '#000' : theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: isDark ? 'rgba(94, 75, 139, 0.1)' : 'rgba(94, 75, 139, 0.05)',
  },
});

export function DarkModeScreen({ navigation, onBack }) {
  const { theme, isDark, themeMode, setTheme } = useTheme();
  const dynamicStyles = getDynamicStyles(theme, isDark);
  const backgroundColor = isDark ? '#000000' : theme.colors.background;

  const themeOptions = [
    {
      id: 'light',
      title: 'Light Mode',
      description: 'Use light theme throughout the app',
      icon: 'sunny-outline',
    },
    {
      id: 'dark',
      title: 'Dark Mode',
      description: 'Use dark theme throughout the app',
      icon: 'moon-outline',
    },
    {
      id: 'system',
      title: 'System Default',
      description: 'Automatically switch based on device settings',
      icon: 'phone-portrait-outline',
    },
  ];

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor }]}>
      <Header title="Dark Mood Settings" onBack={onBack} />
      <ScrollView 
        style={{ backgroundColor }}
        contentContainerStyle={[styles.scrollContainer, { backgroundColor }]}
      >
        <View style={[styles.headerSection]}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface }]}>
            <Ionicons name="moon-outline" size={40} color={isDark ? '#FFFFFF' : theme.colors.primary} />
          </View>
          {/* <Text style={[styles.title, dynamicStyles.textPrimary]}>Dark Mood Settings</Text> */}
          <Text style={[styles.subtitle, dynamicStyles.textMuted]}>
            Choose your preferred theme appearance
          </Text>
        </View>

        <View style={[styles.settingsCard, dynamicStyles.settingsCard, {
          shadowColor: isDark ? '#5E4B8B' : '#000000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.6 : 0.3,
          shadowRadius: 20,
          elevation: 15,
        }]}>
          <Text style={[styles.sectionTitle, dynamicStyles.textPrimary]}>Select Theme</Text>
          
          {themeOptions.map((option) => {
            const isSelected = themeMode === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionContainer,
                  dynamicStyles.optionCard,
                  isSelected && dynamicStyles.selectedOption,
                ]}
                onPress={() => setTheme(option.id)}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: isSelected ? theme.colors.primary : (isDark ? '#333' : '#F0F0F0') }]}>
                    <Ionicons 
                      name={option.icon} 
                      size={20} 
                      color={isSelected ? '#FFFFFF' : (isDark ? '#A0A0A0' : theme.colors.textMuted)} 
                    />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, dynamicStyles.textPrimary]}>{option.title}</Text>
                    <Text style={[styles.optionDescription, dynamicStyles.textMuted]}>{option.description}</Text>
                  </View>
                </View>
                <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                  {isSelected && (
                    <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.primary }]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.infoCard, dynamicStyles.settingsCard, {
          shadowColor: isDark ? '#5E4B8B' : '#000000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.6 : 0.3,
          shadowRadius: 20,
          elevation: 15,
        }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.infoTitle, dynamicStyles.textPrimary]}>About Themes</Text>
          </View>
          <Text style={[styles.infoText, dynamicStyles.textMuted]}>
            Dark mode reduces eye strain in low-light environments and can help save battery life on devices with OLED screens.
          </Text>
          <Text style={[styles.infoText, dynamicStyles.textMuted]}>
            System default automatically switches between light and dark themes based on your device settings.
          </Text>
          <Text style={[styles.infoText, dynamicStyles.textMuted]}>
            Your preference will be automatically saved and applied the next time you open the app.
          </Text>
        </View>

        <View style={[styles.previewCard, dynamicStyles.settingsCard, {
          shadowColor: isDark ? '#5E4B8B' : '#000000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.6 : 0.3,
          shadowRadius: 20,
          elevation: 15,
        }]}>
          <Text style={[styles.previewTitle, dynamicStyles.textPrimary]}>Preview</Text>
          <View style={[styles.previewContent, { 
            backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
            borderColor: isDark ? '#444' : theme.colors.border
          }]}>
            <Text style={[styles.previewText, dynamicStyles.textPrimary]}>
              This is how your text will appear in {isDark ? 'dark' : 'light'} mode.
            </Text>
            <Text style={[styles.previewSubtext, dynamicStyles.textMuted]}>
              Secondary text and UI elements will adapt to the selected theme.
            </Text>
            <Text style={[styles.previewStatus, dynamicStyles.textMuted]}>
              Current mode: {themeMode === 'system' ? 'System Default' : (themeMode === 'dark' ? 'Dark Mode' : 'Light Mode')}
            </Text>
          </View>
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#5A3785',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7A6FA3',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    marginBottom: 16,
    padding: 20,
    shadowColor: '#5E4B8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: {
    color: '#5A3785',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    marginBottom: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    color: '#5A3785',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    color: '#7A6FA3',
    fontSize: 13,
    lineHeight: 18,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E6D6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#5E4B8B',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    marginBottom: 16,
    padding: 20,
    shadowColor: '#5E4B8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    color: '#5A3785',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    color: '#7A6FA3',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    marginBottom: 16,
    padding: 20,
    shadowColor: '#5E4B8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  previewTitle: {
    color: '#5A3785',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewContent: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  previewText: {
    color: '#5A3785',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  previewSubtext: {
    color: '#7A6FA3',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  previewStatus: {
    color: '#7A6FA3',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
