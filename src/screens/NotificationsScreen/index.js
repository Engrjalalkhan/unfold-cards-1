import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, FlatList, Dimensions, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { getStoredNotifications, markNotificationAsRead, clearAllNotifications } from '../../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive breakpoints
const isSmallScreen = screenWidth < 360;
const isMediumScreen = screenWidth >= 360 && screenWidth < 480;
const isLargeScreen = screenWidth >= 480;

const getDynamicStyles = (theme, isDark) => ({
  bgBackground: { backgroundColor: isDark ? '#000000' : theme.colors.background },
  bgSurface: { backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface },
  borderColor: { borderColor: isDark ? '#333' : theme.colors.border },
  shadowColor: { shadowColor: isDark ? '#000' : theme.colors.shadow },
  textPrimary: { color: theme.colors.text },
  textMuted: { color: theme.colors.textMuted },
});

export function NotificationsScreen({ onBack }) {
  const { theme, isDark } = useTheme();
  const dynamicStyles = getDynamicStyles(theme, isDark);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [customType, setCustomType] = useState('');
  const [customZone, setCustomZone] = useState('');
  const [customSubcategory, setCustomSubcategory] = useState('');

  // Predefined options for dropdowns
  const typeOptions = ['Daily Reminder', 'Weekly Highlights', 'General', 'Custom', 'New Category Alert'];
  const zoneOptions = ['Personal Growth', 'Relationships', 'Career', 'Health', 'Finance', 'Spirituality', 'Creativity'];
  const subcategoryOptions = ['Self-Reflection', 'Goals', 'Habits', 'Mindfulness', 'Learning', 'Communication', 'Leadership'];
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const storedNotifications = await getStoredNotifications();
        setNotifications(storedNotifications);
        setLoading(false);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setLoading(false);
      }
    };
    
    loadNotifications();
  }, []);

  // Debug modal state
  useEffect(() => {
    console.log('🔍 Modal visible:', modalVisible);
    console.log('🔍 Selected notification:', selectedNotification);
  }, [modalVisible, selectedNotification]);

  // Group notifications by type with proper categorization
  const groupedNotifications = notifications.reduce((groups, notification) => {
    let category = 'General';
    
    // Categorize based on notification type
    if (notification.type === 'daily_question' || notification.category === 'Daily Reminder') {
      category = 'Daily Reminder';
    } else if (notification.type === 'weekly_highlights' || notification.category === 'Weekly Highlights') {
      category = 'Weekly Highlights';
    } else if (notification.type === 'new_category' || notification.category === 'New Category Alert') {
      category = 'General';
    } else if (notification.type === 'custom' || notification.category === 'Custom') {
      category = 'General';
    } else {
      category = 'General';
    }
    
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(notification);
    return groups;
  }, {});

  const handleClearAll = async () => {
    await clearAllNotifications();
    setNotifications([]);
    setSelectedNotifications(new Set());
  };

  const handleNotificationPress = (item) => {
    // If in selection mode, toggle selection
    if (selectedNotifications.size > 0) {
      const newSelected = new Set(selectedNotifications);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedNotifications(newSelected);
    } else {
      // Normal tap - mark as read and show modal
      console.log('🔔 Opening modal for notification:', item);
      markNotificationAsRead(item.id);
      setNotifications(notifications.map(notif => 
        notif.id === item.id ? { ...notif, read: true } : notif
      ));
      
      // Reset answer and show modal
      setAnswer('');
      setSelectedNotification(item);
      console.log('📱 Setting modal visible to true');
      setModalVisible(true);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !selectedNotification) return;
    
    setIsSubmitting(true);
    
    try {
      // Add answer to AsyncStorage (similar to DiscoverScreen)
      const storedAnswers = await AsyncStorage.getItem('userAnswers');
      const answers = storedAnswers ? JSON.parse(storedAnswers) : [];
      
      const finalType = customType || selectedType || selectedNotification?.category || 'General';
      const finalZone = customZone || selectedZone || selectedNotification?.zone || 'General';
      const finalSubcategory = customSubcategory || selectedSubcategory || selectedNotification?.subcategory || 'General';
      
      const newAnswer = {
        id: Date.now().toString(),
        questionId: selectedNotification.id,
        questionTitle: selectedNotification.title,
        question: selectedNotification.body,
        answer: answer.trim(),
        category: finalType,
        zone: finalZone,
        subcategory: finalSubcategory,
        timestamp: new Date().toISOString(),
        source: 'notification'
      };
      
      answers.unshift(newAnswer);
      await AsyncStorage.setItem('userAnswers', JSON.stringify(answers));
      
      console.log('✅ Answer saved from notification:', newAnswer);
      
      // Reset form fields
      setModalVisible(false);
      setAnswer('');
      setSelectedType('');
      setSelectedZone('');
      setSelectedSubcategory('');
      setCustomType('');
      setCustomZone('');
      setCustomSubcategory('');
      setSelectedNotification(null);
      
    } catch (error) {
      console.error('❌ Error saving answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationLongPress = (item) => {
    // Toggle selection on long press
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedNotifications(newSelected);
  };

  const clearSelection = () => {
    setSelectedNotifications(new Set());
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      // Filter out selected notifications
      const updatedNotifications = notifications.filter(notif => !selectedNotifications.has(notif.id));
      setNotifications(updatedNotifications);
      
      // Update storage
      await AsyncStorage.setItem('RECEIVED_NOTIFICATIONS', JSON.stringify(updatedNotifications));
      
      // Clear selection
      setSelectedNotifications(new Set());
      
      console.log(`🗑️ Deleted ${selectedNotifications.size} notifications`);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const renderNotification = (item) => {
    const isSelected = selectedNotifications.has(item.id);
    const categoryIcon = getCategoryIcon(item.type, item.category);
    const categoryColor = getCategoryColor(item.type, item.category);
    
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[
          styles.notificationCard, 
          dynamicStyles.bgSurface, 
          dynamicStyles.borderColor, 
          dynamicStyles.shadowColor,
          isSelected && styles.selectedNotificationCard,
          isSmallScreen && styles.notificationCardSmall
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleNotificationLongPress(item)}
        delayLongPress={300}
        activeOpacity={0.7}
      >
        <View style={[
          styles.notificationContent,
          isSmallScreen && styles.notificationContentSmall
        ]}>
          <View style={[
            styles.notificationIcon,
            { backgroundColor: categoryColor },
            isSmallScreen && styles.notificationIconSmall
          ]}>
            <Ionicons 
              name={categoryIcon} 
              size={isSmallScreen ? 14 : 16} 
              color="#FFFFFF" 
            />
          </View>
          <View style={styles.notificationText}>
            <Text style={[
              styles.notificationTitle,
              { color: isDark ? '#A0A0A0' : '#4A3A75' },
              isSmallScreen && styles.notificationTitleSmall
            ]}>
              {item.title}
            </Text>
            <Text style={[
              styles.notificationBody,
              { color: isDark ? '#A0A0A0' : '#7D6BA6' },
              isSmallScreen && styles.notificationBodySmall
            ]}>
              {item.body}
            </Text>
            <Text style={[
              styles.notificationTime,
              { color: isDark ? '#A0A0A0' : '#7D6BA6' },
              isSmallScreen && styles.notificationTimeSmall
            ]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          {!item.read && (
            <View style={[
              styles.unreadBadge,
              isSmallScreen && styles.unreadBadgeSmall
            ]} 
            />
          )}
          {isSelected && (
            <View style={[
              styles.selectionIndicator,
              isSmallScreen && styles.selectionIndicatorSmall
            ]}>
              <Ionicons 
                name="checkmark" 
                size={isSmallScreen ? 10 : 12} 
                color="#FFFFFF" 
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategorySection = (category, categoryNotifications) => {
    const categoryIcon = getCategoryIcon(categoryNotifications[0]?.type, category);
    const categoryColor = getCategoryColor(categoryNotifications[0]?.type, category);
    
    return (
      <View key={category} style={[
        styles.categorySection,
        isSmallScreen && styles.categorySectionSmall
      ]}>
        <View style={[
          styles.categoryHeader,
          dynamicStyles.borderColor,
          isSmallScreen && styles.categoryHeaderSmall
        ]}>
          <View style={styles.categoryTitleContainer}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: categoryColor },
              isSmallScreen && styles.categoryIconSmall
            ]}>
              <Ionicons 
                name={categoryIcon} 
                size={isSmallScreen ? 18 : 20} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={[
              styles.categoryTitle,
              { color: isDark ? '#A0A0A0' : '#2F2752' },
              isSmallScreen && styles.categoryTitleSmall
            ]}>
              {category}
            </Text>
          </View>
          <View style={styles.categoryCountContainer}>
            <Text style={[
              styles.categoryCount,
              { color: isDark ? '#A0A0A0' : '#7D6BA6' },
              isSmallScreen && styles.categoryCountSmall
            ]}>
              {categoryNotifications.length}
            </Text>
            <Text style={[
              styles.categoryCountLabel,
              { color: isDark ? '#A0A0A0' : '#7D6BA6' },
              isSmallScreen && styles.categoryCountLabelSmall
            ]}>
              {categoryNotifications.length === 1 ? 'notification' : 'notifications'}
            </Text>
          </View>
        </View>
        <View style={[
          styles.notificationsList,
          isSmallScreen && styles.notificationsListSmall
        ]}>
          {categoryNotifications.map(renderNotification)}
        </View>
      </View>
    );
  };

  const getCategoryIcon = (type, category) => {
    // Daily Reminder icons
    if (type === 'daily_question' || category === 'Daily Reminder') {
      return 'sunny';
    }
    // Weekly Highlights icons
    if (type === 'weekly_highlights' || category === 'Weekly Highlights') {
      return 'bar-chart';
    }
    // New Category Alert icons (in General)
    if (type === 'new_category' || category === 'New Category Alert') {
      return 'add-circle';
    }
    // Custom notifications (in General)
    if (type === 'custom' || category === 'Custom') {
      return 'information-circle';
    }
    // Default icons for other types
    const iconMap = {
      'reengage': 'notifications',
      'two_second_question': 'flash',
      'firebase': 'notifications'
    };
    return iconMap[type] || 'notifications';
  };

  const getCategoryColor = (type, category) => {
    // Daily Reminder - Orange/Yellow
    if (type === 'daily_question' || category === 'Daily Reminder') {
      return '#FF9500';
    }
    // Weekly Highlights - Blue
    if (type === 'weekly_highlights' || category === 'Weekly Highlights') {
      return '#007AFF';
    }
    // New Category Alert - Green
    if (type === 'new_category' || category === 'New Category Alert') {
      return '#34C759';
    }
    // Custom notifications - Purple
    if (type === 'custom' || category === 'Custom') {
      return '#8B5CF6';
    }
    // Default color
    return '#8B5CF6';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
        <View style={[styles.headerRow, dynamicStyles.bgBackground]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#2F2752'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#3E2C6E' }]}>Notifications</Text>
        </View>

        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? '#A0A0A0' : '#7D6BA6' }]}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
      <View style={[styles.headerRow, dynamicStyles.bgBackground]}>
        <TouchableOpacity 
          style={[
            styles.backButton, 
            { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
            screenWidth < 360 && styles.backButtonSmall
          ]} 
          onPress={selectedNotifications.size > 0 ? clearSelection : onBack}
        >
          <Ionicons 
            name={selectedNotifications.size > 0 ? "close" : "arrow-back"} 
            size={screenWidth < 360 ? 18 : 20} 
            color={isDark ? '#FFFFFF' : '#2F2752'} 
          />
        </TouchableOpacity>
        
        <Text style={[
          styles.headerTitle, 
          { color: isDark ? '#FFFFFF' : '#3E2C6E' },
          screenWidth < 400 && styles.headerTitleSmall
        ]}>
          {selectedNotifications.size > 0 ? 
            `${selectedNotifications.size} Selected` : 
            'Notifications'
          }
        </Text>
        
        <View style={styles.headerRight}>
          {selectedNotifications.size > 0 ? (
            <TouchableOpacity 
              onPress={deleteSelectedNotifications} 
              style={[
                styles.deleteButton, 
                { backgroundColor: '#FF4444' },
                screenWidth < 360 && styles.deleteButtonSmall
              ]}
            >
              <Ionicons 
                name="trash" 
                size={screenWidth < 360 ? 18 : 20} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={handleClearAll} 
              style={[
                styles.clearButton,
                screenWidth < 360 && styles.clearButtonSmall
              ]}
            >
              <Ionicons 
                name="trash-outline" 
                size={screenWidth < 360 ? 16 : 18} 
                color={isDark ? '#FFFFFF' : '#7D6BA6'} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={[styles.container, dynamicStyles.bgBackground]} showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isSmallScreen && styles.scrollContentSmall
        ]}
      >
        {notifications.length === 0 ? (
          <View style={[
            styles.emptyContainer,
            isSmallScreen && styles.emptyContainerSmall
          ]}>
            <View style={[
              styles.emptyIcon,
              { backgroundColor: isDark ? '#1E1E1E' : '#F0E5FF' }
            ]}>
              <Ionicons 
                name="notifications-off" 
                size={isSmallScreen ? 40 : 48} 
                color={isDark ? '#8B5CF6' : '#8B5CF6'} 
              />
            </View>
            <Text style={[
              styles.emptyTitle,
              { color: isDark ? '#A0A0A0' : '#2F2752' },
              isSmallScreen && styles.emptyTitleSmall
            ]}>
              No Notifications
            </Text>
            <Text style={[
              styles.emptyDescription,
              { color: isDark ? '#A0A0A0' : '#7D6BA6' },
              isSmallScreen && styles.emptyDescriptionSmall
            ]}>
              You'll see your notifications here when they arrive
            </Text>
            
            {/* Test button for debugging */}
            <TouchableOpacity
              style={[
                styles.testButton,
                { backgroundColor: '#8B5CF6' }
              ]}
              onPress={() => {
                console.log('🧪 Test button pressed');
                const testNotification = {
                  id: 'test-123',
                  title: '🌅 Test Question',
                  body: 'This is a test question to verify the modal works correctly. Can you see this?',
                  category: 'Daily Reminder',
                  zone: 'Test Zone',
                  subcategory: 'Test Subcategory',
                  timestamp: new Date().toISOString()
                };
                setSelectedNotification(testNotification);
                setModalVisible(true);
                console.log('🧪 Test notification set:', testNotification);
                console.log('🧪 Modal visible set to true');
              }}
            >
              <Text style={styles.testButtonText}>Test Modal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.categoriesContainer}>
            {Object.entries(groupedNotifications).map(([category, categoryNotifications]) => 
              renderCategorySection(category, categoryNotifications)
            )}
          </View>
        )}
      </ScrollView>
      
      {/* Notification Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            dynamicStyles.bgSurface,
            isSmallScreen && styles.modalContentSmall
          ]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[
                styles.modalTitle,
                { color: isDark ? '#A0A0A0' : '#2F2752' },
                isSmallScreen && styles.modalTitleSmall
              ]}>
                {selectedNotification?.title || 'Question'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.modalCloseButton,
                  { backgroundColor: isDark ? '#000000' : '#F0E5FF' }
                ]}
                onPress={() => {
                  console.log('🔔 Modal closed via close button');
                  setModalVisible(false);
                }}
              >
                <Ionicons 
                  name="close" 
                  size={isSmallScreen ? 20 : 24} 
                  color={isDark ? '#FFFFFF' : '#8B5CF6'} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Modal Content */}
            <ScrollView 
              style={styles.modalScrollView} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.modalBody}>
                {/* Question Display */}
                <View style={[
                  styles.questionContainer,
                  { backgroundColor: isDark ? '#000000' : '#F8F9FA' }
                ]}>
                  <Text style={[
                    styles.questionLabel,
                    { color: isDark ? '#A0A0A0' : '#7D6BA6' }
                  ]}>
                    Question
                  </Text>
                  <Text style={[
                    styles.questionText,
                    { color: isDark ? '#A0A0A0' : '#2F2752' },
                    isSmallScreen && styles.questionTextSmall
                  ]}>
                    {selectedNotification?.body || 'No question available'}
                  </Text>
                </View>
                
                {/* Answer Input */}
                <View style={styles.answerContainer}>
                  <Text style={[
                    styles.answerLabel,
                    { color: isDark ? '#A0A0A0' : '#7D6BA6' }
                  ]}>
                    Your Answer
                  </Text>
                  <TextInput
                    style={[
                      styles.answerInput,
                      dynamicStyles.bgSurface,
                      dynamicStyles.borderColor,
                      { color: isDark ? '#A0A0A0' : '#2F2752' },
                      isSmallScreen && styles.answerInputSmall
                    ]}
                    placeholder="Type your answer here..."
                    placeholderTextColor={isDark ? '#A0A0A0' : '#7D6BA6'}
                    multiline
                    value={answer}
                    onChangeText={setAnswer}
                    textAlignVertical="top"
                    autoFocus={true}
                  />
                  <Text style={[
                    styles.answerHint,
                    { color: isDark ? '#A0A0A0' : '#7D6BA6' }
                  ]}>
                    Share your thoughts and insights about this question...
                  </Text>
                </View>

                {/* Category Selection */}
                <View style={styles.categorySelectionContainer}>
                  <Text style={[
                    styles.sectionLabel,
                    { color: isDark ? '#A0A0A0' : '#7D6BA6' }
                  ]}>
                    Categorize Your Answer
                  </Text>
                  
                  {/* Type Selection */}
                  <View style={styles.selectionRow}>
                    <Text style={[
                      styles.selectionLabel,
                      { color: isDark ? '#A0A0A0' : '#2F2752' }
                    ]}>
                      Type:
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.optionsScrollView}
                    >
                      {typeOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.optionChip,
                            { 
                              backgroundColor: selectedType === option ? '#8B5CF6' : (isDark ? '#000000' : '#F0E5FF'),
                              borderColor: isDark ? '#444' : '#DDD'
                            }
                          ]}
                          onPress={() => {
                            setSelectedType(option);
                            setCustomType('');
                          }}
                        >
                          <Text style={[
                            styles.optionText,
                            { color: selectedType === option ? '#FFFFFF' : (isDark ? '#A0A0A0' : '#7D6BA6') }
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Custom Type Input */}
                  {selectedType === 'Custom' && (
                    <View style={styles.customInputContainer}>
                      <TextInput
                        style={[
                          styles.customInput,
                          dynamicStyles.bgSurface,
                          dynamicStyles.borderColor,
                          { color: isDark ? '#A0A0A0' : '#2F2752' }
                        ]}
                        placeholder="Enter custom type..."
                        placeholderTextColor={isDark ? '#A0A0A0' : '#7D6BA6'}
                        value={customType}
                        onChangeText={setCustomType}
                      />
                    </View>
                  )}

                  {/* Zone Selection */}
                  <View style={styles.selectionRow}>
                    <Text style={[
                      styles.selectionLabel,
                      { color: isDark ? '#A0A0A0' : '#2F2752' }
                    ]}>
                      Zone:
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.optionsScrollView}
                    >
                      {zoneOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.optionChip,
                            { 
                              backgroundColor: selectedZone === option ? '#8B5CF6' : (isDark ? '#000000' : '#F0E5FF'),
                              borderColor: isDark ? '#444' : '#DDD'
                            }
                          ]}
                          onPress={() => {
                            setSelectedZone(option);
                            setCustomZone('');
                          }}
                        >
                          <Text style={[
                            styles.optionText,
                            { color: selectedZone === option ? '#FFFFFF' : (isDark ? '#A0A0A0' : '#7D6BA6') }
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Custom Zone Input */}
                  {selectedZone === 'Custom' && (
                    <View style={styles.customInputContainer}>
                      <TextInput
                        style={[
                          styles.customInput,
                          dynamicStyles.bgSurface,
                          dynamicStyles.borderColor,
                          { color: isDark ? '#A0A0A0' : '#2F2752' }
                        ]}
                        placeholder="Enter custom zone..."
                        placeholderTextColor={isDark ? '#A0A0A0' : '#7D6BA6'}
                        value={customZone}
                        onChangeText={setCustomZone}
                      />
                    </View>
                  )}

                  {/* Subcategory Selection */}
                  <View style={styles.selectionRow}>
                    <Text style={[
                      styles.selectionLabel,
                      { color: isDark ? '#A0A0A0' : '#2F2752' }
                    ]}>
                      Subcategory:
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      style={styles.optionsScrollView}
                    >
                      {subcategoryOptions.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.optionChip,
                            { 
                              backgroundColor: selectedSubcategory === option ? '#8B5CF6' : (isDark ? '#000000' : '#F0E5FF'),
                              borderColor: isDark ? '#444' : '#DDD'
                            }
                          ]}
                          onPress={() => {
                            setSelectedSubcategory(option);
                            setCustomSubcategory('');
                          }}
                        >
                          <Text style={[
                            styles.optionText,
                            { color: selectedSubcategory === option ? '#FFFFFF' : (isDark ? '#A0A0A0' : '#7D6BA6') }
                          ]}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Custom Subcategory Input */}
                  {selectedSubcategory === 'Custom' && (
                    <View style={styles.customInputContainer}>
                      <TextInput
                        style={[
                          styles.customInput,
                          dynamicStyles.bgSurface,
                          dynamicStyles.borderColor,
                          { color: isDark ? '#A0A0A0' : '#2F2752' }
                        ]}
                        placeholder="Enter custom subcategory..."
                        placeholderTextColor={isDark ? '#A0A0A0' : '#7D6BA6'}
                        value={customSubcategory}
                        onChangeText={setCustomSubcategory}
                      />
                    </View>
                  )}
                </View>
                
                {/* Notification Metadata */}
                <View style={styles.modalMetadata}>
                  <View style={styles.metadataRow}>
                    <Text style={[
                      styles.metadataLabel,
                      { color: isDark ? '#A0A0A0' : '#7D6BA6' }
                    ]}>
                      Type:
                    </Text>
                    <Text style={[
                      styles.metadataValue,
                      { color: isDark ? '#A0A0A0' : '#4A3A75' }
                    ]}>
                      {selectedNotification?.category || 'General'}
                    </Text>
                  </View>
                  
                  {selectedNotification?.zone && (
                    <View style={styles.metadataRow}>
                      <Text style={[
                        styles.metadataLabel,
                        { color: isDark ? '#A0A0A0' : '#7D6BA6' }
                      ]}>
                        Zone:
                      </Text>
                      <Text style={[
                        styles.metadataValue,
                        { color: isDark ? '#A0A0A0' : '#4A3A75' }
                      ]}>
                        {selectedNotification.zone}
                      </Text>
                    </View>
                  )}
                  
                  {selectedNotification?.subcategory && (
                    <View style={styles.metadataRow}>
                      <Text style={[
                        styles.metadataLabel,
                        { color: isDark ? '#A0A0A0' : '#7D6BA6' }
                      ]}>
                        Subcategory:
                      </Text>
                      <Text style={[
                        styles.metadataValue,
                        { color: isDark ? '#A0A0A0' : '#4A3A75' }
                      ]}>
                        {selectedNotification.subcategory}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.metadataRow}>
                    <Text style={[
                      styles.metadataLabel,
                      { color: isDark ? '#A0A0A0' : '#7D6BA6' }
                    ]}>
                      Received:
                    </Text>
                    <Text style={[
                      styles.metadataValue,
                      { color: isDark ? '#A0A0A0' : '#4A3A75' }
                    ]}>
                      {selectedNotification?.timestamp ? 
                        new Date(selectedNotification.timestamp).toLocaleString() : 
                        'Unknown'
                      }
                    </Text>
                  </View>
                </View>
                
                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.skipButton,
                      { backgroundColor: isDark ? '#000000' : '#F0E5FF' },
                      isSmallScreen && styles.skipButtonSmall
                    ]}
                    onPress={() => {
                      console.log('🔔 Skip button pressed');
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.skipButtonText,
                      { color: isDark ? '#FFFFFF' : '#8B5CF6' },
                      isSmallScreen && styles.skipButtonTextSmall
                    ]}>
                      Skip
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: answer.trim() ? '#8B5CF6' : '#CCCCCC' },
                      isSmallScreen && styles.submitButtonSmall
                    ]}
                    onPress={() => {
                      console.log('🔔 Submit button pressed, answer:', answer);
                      handleSubmitAnswer();
                    }}
                    disabled={!answer.trim() || isSubmitting}
                  >
                    <Text style={[
                      styles.submitButtonText,
                      isSmallScreen && styles.submitButtonTextSmall
                    ]}>
                      {isSubmitting ? 'Saving...' : 'Submit Answer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  scrollContentSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  categoriesContainer: {
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
    paddingTop:50
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  backButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    alignSelf: 'center',
  },
  headerTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
  },
  // Category section styles
  categorySection: {
    marginBottom: 8,
  },
  categorySectionSmall: {
    marginBottom: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  categoryHeaderSmall: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2752',
  },
  categoryTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCountContainer: {
    alignItems: 'flex-end',
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7D6BA6',
  },
  categoryCountSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryCountLabel: {
    fontSize: 12,
    color: '#7D6BA6',
    marginTop: 2,
  },
  categoryCountLabelSmall: {
    fontSize: 11,
    marginTop: 1,
  },
  notificationsList: {
    gap: 8,
  },
  notificationsListSmall: {
    gap: 6,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F0E5FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationCardSmall: {
    padding: 12,
    marginBottom: 6,
    marginHorizontal: 2,
    borderRadius: 12,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationContentSmall: {
    gap: 10,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  notificationIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    marginTop: 1,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A3A75',
    marginBottom: 4,
    lineHeight: 22,
  },
  notificationTitleSmall: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  notificationBody: {
    fontSize: 14,
    color: '#7D6BA6',
    marginBottom: 6,
    lineHeight: 20,
  },
  notificationBodySmall: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: '#7D6BA6',
    fontStyle: 'italic',
  },
  notificationTimeSmall: {
    fontSize: 11,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
    marginLeft: 8,
    marginTop: 4,
  },
  unreadBadgeSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
    marginTop: 3,
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 2,
  },
  selectionIndicatorSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: 6,
    marginTop: 1,
  },
  notificationCardCompact: {
    backgroundColor: '#F5ECFE',
  },
  selectedNotificationCard: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  clearButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyContainerSmall: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F2752',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTitleSmall: {
    fontSize: 18,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#7D6BA6',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyDescriptionSmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  testButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedNotificationCard: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  deleteButtonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  clearButtonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#000000',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    flex: 1,
  },
  modalContentSmall: {
    maxWidth: 350,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E5FF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2752',
    flex: 1,
  },
  modalTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flex: 1,
    minHeight: 200,
  },
  modalBody: {
    padding: 20,
    paddingBottom: 30,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4A3A75',
    marginBottom: 24,
    fontWeight: '500',
  },
  modalMessageSmall: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalMetadata: {
    gap: 12,
    marginBottom: 24,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#7D6BA6',
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A3A75',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  modalActions: {
    gap: 12,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
  },
  actionButtonSmall: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonTextSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Question and Answer styles
  questionContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  questionTextSmall: {
    fontSize: 16,
    lineHeight: 24,
  },
  questionDescriptionContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  questionDescriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionDescriptionText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
  },
  questionDescriptionTextSmall: {
    fontSize: 14,
    lineHeight: 22,
  },
  answerContainer: {
    marginBottom: 20,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  answerInputSmall: {
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  answerHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Category Selection styles
  categorySelectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  selectionRow: {
    marginBottom: 16,
  },
  selectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionsScrollView: {
    flexDirection: 'row',
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customInputContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  customInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  skipButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  skipButtonSmall: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 70,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButtonTextSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 140,
  },
  submitButtonSmall: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 120,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonTextSmall: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
