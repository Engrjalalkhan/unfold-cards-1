import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export function FavoritesScreen({ items, onOpen, onRemove, onBack, onShareQuestion, onToggleRead }) {
  const { theme } = useTheme();
  
  const handleShareQuestion = async (question, category) => {
    try {
      const shareContent = `Question from ${category}:\n\n${question}\n\n- Unfold Cards App`;
      
      await Share.share({
        message: shareContent,
        title: 'Question from Unfold Cards',
        url: 'https://unfold-cards.app'
      });
      
      console.log('Shared favorite question:', question);
      
      // Also call the original onShareQuestion if provided
      if (onShareQuestion) {
        onShareQuestion(`${category}: ${question}`);
      }
    } catch (error) {
      console.error('Error sharing favorite question:', error);
    }
  };
  // Helper function to get zone name from category ID or category name
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
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title="Favorites" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            <View key={item.id} style={[styles.questionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              {/* Zone Header */}
              <View style={styles.cardHeader}>
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
                <Text style={[styles.questionText, { color: theme.colors.text }]}>{item.question}</Text>
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
                    backgroundColor: theme.colors.surfaceTint,
                    borderColor: theme.colors.border 
                  }]} 
                  onPress={() => handleShareQuestion(item.question, item.zone)}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
