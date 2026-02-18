import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';

const getDynamicStyles = (theme, isDark) => ({
  bgBackground: { backgroundColor: isDark ? '#000000' : '#FFFFFF' },
  bgSurface: { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
  borderColor: { borderColor: isDark ? '#333' : '#E6D6FF' },
  shadowColor: { shadowColor: isDark ? '#000' : '#7A6FA3' },
  textPrimary: { color: theme.colors.text },
  textMuted: { color: theme.colors.textMuted },
});

export function SubmittedAnswersScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const dynamicStyles = getDynamicStyles(theme, isDark);
  
  const { subcategory, answers, zoneColor } = route.params || {};

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        borderBottomColor: isDark ? '#333' : '#E6D6FF',
        borderBottomWidth: 1,
      },
      headerTintColor: isDark ? '#FFFFFF' : theme.colors.text,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 18,
      },
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 16 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? '#FFFFFF' : theme.colors.text} 
          />
        </TouchableOpacity>
      ),
      title: subcategory?.name || 'Submitted Answers',
    });
  }, [navigation, subcategory, theme, isDark]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!answers || answers.length === 0) {
    return (
      <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="document-text-outline" 
            size={64} 
            color={isDark ? '#A0A0A0' : '#7D6BA6'} 
          />
          <Text style={[styles.emptyTitle, dynamicStyles.textPrimary]}>
            No Submitted Answers
          </Text>
          <Text style={[styles.emptyDescription, dynamicStyles.textMuted]}>
            There are no submitted answers in this category yet.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      
      {/* Header Section */}
      <View style={[
        styles.headerSection,
        dynamicStyles.bgSurface,
        { borderBottomColor: isDark ? '#333' : '#E6D6FF' }
      ]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: zoneColor || '#8B5CF6' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, dynamicStyles.textPrimary]}>
              {subcategory?.name || 'Submitted Answers'}
            </Text>
            <Text style={[styles.headerSubtitle, dynamicStyles.textMuted]}>
              {answers.length} {answers.length === 1 ? 'answer' : 'answers'}
            </Text>
          </View>
        </View>
      </View>

      {/* Answers List */}
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.containerContent}
        showsVerticalScrollIndicator={false}
      >
        {answers.map((answer, index) => (
          <View key={answer.id || index} style={styles.answerCard}>
            <LinearGradient
              style={[styles.answerCardGradient, { borderRadius: 20 }]}
              colors={(zoneColor || '#8B5CF6') + '15'}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            
            <View style={styles.answerCardContent}>
              {/* Question Section */}
              <View style={styles.questionSection}>
                <Text style={[styles.questionLabel, dynamicStyles.textMuted]}>
                  Question
                </Text>
                <Text style={[styles.questionText, dynamicStyles.textPrimary]}>
                  {answer.question}
                </Text>
              </View>
              
              {/* Answer Section */}
              <View style={styles.answerSection}>
                <Text style={[styles.answerLabel, dynamicStyles.textMuted]}>
                  Your Answer
                </Text>
                <Text style={[styles.answerText, dynamicStyles.textPrimary]}>
                  {answer.answer}
                </Text>
              </View>
              
              {/* Metadata Section */}
              <View style={styles.metadataSection}>
                <View style={styles.metadataRow}>
                  <Text style={[styles.metadataLabel, dynamicStyles.textMuted]}>
                    Category:
                  </Text>
                  <Text style={[styles.metadataValue, dynamicStyles.textPrimary]}>
                    {answer.category || 'General'}
                  </Text>
                </View>
                
                <View style={styles.metadataRow}>
                  <Text style={[styles.metadataLabel, dynamicStyles.textMuted]}>
                    Zone:
                  </Text>
                  <Text style={[styles.metadataValue, dynamicStyles.textPrimary]}>
                    {answer.zone || 'General'}
                  </Text>
                </View>
                
                <View style={styles.metadataRow}>
                  <Text style={[styles.metadataLabel, dynamicStyles.textMuted]}>
                    Submitted:
                  </Text>
                  <Text style={[styles.metadataValue, dynamicStyles.textPrimary]}>
                    {formatDate(answer.timestamp)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  headerSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  containerContent: {
    padding: 20,
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0E5FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  answerCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  answerCardContent: {
    padding: 24,
  },
  questionSection: {
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#7D6BA6',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    color: '#2F2752',
  },
  answerSection: {
    marginBottom: 20,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#7D6BA6',
  },
  answerText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A3A75',
  },
  metadataSection: {
    gap: 8,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7D6BA6',
  },
  metadataValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A3A75',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
});
