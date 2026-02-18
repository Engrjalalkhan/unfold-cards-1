import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export function FavoritesScreen({ items, onOpen, onRemove, onBack, onShareQuestion, onToggleRead }) {
  const { theme, isDark } = useTheme();
  
  const handleShareQuestion = async (question, category) => {
    try {
      // Handle both string and object question formats
      const questionText = typeof question === 'string' ? question : 
        (question && question.question) ? question.question : 'Unknown question';
      
      const shareContent = `Question from ${category}:\n\n${questionText}\n\n- Unfold Cards App`;
      
      await Share.share({
        message: shareContent,
        title: 'Question from Unfold Cards',
        url: 'https://unfold-cards.app'
      });
      
      console.log('Shared favorite question:', questionText);
      
      // Also call the original onShareQuestion if provided
      if (onShareQuestion) {
        onShareQuestion(`${category}: ${questionText}`);
      }
    } catch (error) {
      console.error('Error sharing favorite question:', error);
    }
  };
  // Helper function to extract question text and answer from different data formats
  const extractQuestionData = (item) => {
    if (typeof item.question === 'string') {
      return {
        questionText: item.question,
        answerText: null,
        isSubmittedAnswer: false
      };
    } else if (typeof item.question === 'object' && item.question !== null) {
      return {
        questionText: item.question.question || 'Unknown question',
        answerText: item.question.answer || null,
        isSubmittedAnswer: true,
        metadata: item.question.metadata || null
      };
    } else {
      return {
        questionText: 'Unknown question',
        answerText: null,
        isSubmittedAnswer: false
      };
    }
  };
  const getZoneName = (categoryId, categoryName) => {
    // First try to extract from category name
    if (categoryName) {
      const name = categoryName.toLowerCase();
      if (name.includes('relationship')) return 'Relationship Zone';
      if (name.includes('friendship')) return 'Friendship Zone';
      if (name.includes('family')) return 'Family Zone';
      if (name.includes('emotional')) return 'Emotional Zone';
      if (name.includes('fun')) return 'Fun Zone';
    }
    
    // Then try to extract from category ID
    if (categoryId) {
      const id = categoryId.toLowerCase();
      if (id.includes('relationship')) return 'Relationship Zone';
      if (id.includes('friendship')) return 'Friendship Zone';
      if (id.includes('family')) return 'Family Zone';
      if (id.includes('emotional')) return 'Emotional Zone';
      if (id.includes('fun')) return 'Fun Zone';
    }
    
    // Default to category name if available, otherwise use a generic zone name
    return categoryName ? categoryName : 'Personal Zone';
  };

  // Group by zone instead of category and create individual cards for each question
  const individualQuestions = React.useMemo(() => {
    if (!Array.isArray(items)) return [];
    
    return items.map((item) => ({
      id: `${item.categoryId}-${item.question}`,
      question: item.question || 'No question text',
      categoryId: item.categoryId,
      categoryName: item.categoryName || 'Unknown',
      zone: getZoneName(item.categoryId, item.categoryName),
      color: item.color || '#9D4EDD',
      read: !!item.read,
      timestamp: item.timestamp,
    }));
  }, [items]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <Header title="Favorites" onBack={onBack} />
      <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
        {individualQuestions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={60} color="#E6D6FF" />
            <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>No favorites yet</Text>
            <Text style={[styles.emptyStateSubtitle, { color: theme.colors.textMuted }]}>
              Add questions to favorites from any card to see them here
            </Text>
          </View>
        ) : (
          individualQuestions.map((item) => (
            <View key={item.id} style={[styles.questionCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? '#333' : '#E6D6FF' }]}>
              {/* Zone Header */}
              <View style={[styles.cardHeader, {
                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              }]}>
                <View style={[styles.zoneIndicator, { backgroundColor: item.color }]} />
                <Text style={[styles.zoneTitle, { color: theme.colors.text }]}>{item.zone}</Text>
                <View style={[styles.readStatusBadge, { 
                  backgroundColor: item.read ? item.color : item.color + '20' 
                }]}>
                  <Text style={[styles.readStatusText, { 
                    color: item.read ? '#FFFFFF' : item.color 
                  }]}>{item.read ? 'Read' : 'New'}</Text>
                </View>
              </View>
              
              {/* Question Content */}
              <View style={styles.questionContent}>
                <Text style={[styles.questionText, { color: theme.colors.text }]}>
                  {extractQuestionData(item).questionText}
                </Text>
                
                {/* Show answer for submitted answers */}
                {extractQuestionData(item).isSubmittedAnswer && extractQuestionData(item).answerText && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerLabel}>Your Answer:</Text>
                    <Text style={styles.answerText}>{extractQuestionData(item).answerText}</Text>
                  </View>
                )}
                
                {/* Show metadata for submitted answers */}
                {extractQuestionData(item).isSubmittedAnswer && extractQuestionData(item).metadata && (
                  <View style={styles.metadataContainer}>
                    <Text style={styles.metadataText}>
                      {extractQuestionData(item).metadata.category} • 
                      {extractQuestionData(item).metadata.timestamp ? 
                        new Date(extractQuestionData(item).metadata.timestamp).toLocaleDateString() : 
                        'Unknown date'
                      }
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.readButton, { 
                    backgroundColor: item.read ? item.color : item.color + '20',
                    borderColor: item.color 
                  }]}
                  onPress={() => onToggleRead && onToggleRead({ 
                    categoryId: item.categoryId, 
                    question: item.question, 
                    read: !item.read 
                  })}
                >
                  <Ionicons 
                    name={item.read ? 'checkmark' : 'checkmark-outline'} 
                    size={16} 
                    color={item.read ? '#FFFFFF' : item.color} 
                  />
                  <Text style={[styles.actionButtonText, { 
                    color: item.read ? '#FFFFFF' : item.color 
                  }]}>{item.read ? 'Read' : 'Mark'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.shareButton, { 
                    backgroundColor: isDark ? '#000000' : theme.colors.surfaceTint,
                    borderColor: isDark ? '#000000' : theme.colors.border 
                  }]} 
                  onPress={() => handleShareQuestion(extractQuestionData(item).questionText, item.categoryName || item.zone)}
                >
                  <Ionicons name="share-outline" size={16} color={theme.colors.text} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.removeButton, { 
                    backgroundColor: '#FF444420',
                    borderColor: '#FF444440' 
                  }]} 
                  onPress={() => onRemove({ categoryId: item.categoryId, question: item.question })}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF4444" />
                  <Text style={[styles.actionButtonText, { color: '#FF4444' }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Individual Question Card Styles
  questionCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
    // Enhanced shadow for iOS
    shadowColor: '#5E4B8B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  zoneIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  readStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  readStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Question Content Styles
  questionContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  
  // Answer and Metadata Styles for Submitted Answers
  answerContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2F2752',
  },
  metadataContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 92, 246, 0.2)',
  },
  metadataText: {
    fontSize: 12,
    color: '#7D6BA6',
    fontStyle: 'italic',
  },
  
  // Action Buttons Styles
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  readButton: {
    // Styles applied dynamically
  },
  shareButton: {
    // Styles applied dynamically
  },
  removeButton: {
    // Styles applied dynamically
  },
});
