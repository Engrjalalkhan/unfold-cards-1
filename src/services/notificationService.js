import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { messaging, Notifications } from '../config/firebase';
import { getSubcategoryById } from '../data/decks';
import { zones, allSubcategories } from '../data/decks';

// Import all JSON data files directly for maximum question variety
import relationshipData from '../data/questions.relationship.json';
import friendshipData from '../data/questions.friendship.json';
import familyData from '../data/questions.family.json';
import emotionalData from '../data/questions.emotional.json';
import funData from '../data/questions.fun.json';
import { 
  NOTIF_ENABLED_KEY, 
  REENGAGE_ID_KEY,
  DAILY_REMINDER_KEY,
  WEEKLY_HIGHLIGHTS_KEY,
  NEW_CATEGORY_ALERT_KEY,
  FCM_TOKEN_KEY,
  TWO_SECOND_NOTIF_KEY,
  DAILY_QUESTION_INDEX_KEY
} from '../constants/storageKeys';

const pickSuggestionBody = () => {
  try {
    if (Array.isArray(allCategories) && allCategories.length > 0) {
      const c = allCategories[Math.floor(Math.random() * allCategories.length)];
      const name = c?.name || 'a category';
      return `Take a moment today — try a card from ${name}.`;
    }
    return 'Take a moment today — connect with someone meaningful.';
  } catch (error) {
    console.error('Error picking suggestion body:', error);
    return 'Take a moment today — connect with someone meaningful.';
  }
};

// Load all questions from all JSON data files
const loadAllQuestionsFromData = () => {
  const allDataSources = [
    { name: 'Relationship Zone', data: relationshipData },
    { name: 'Friendship Zone', data: friendshipData },
    { name: 'Family Zone', data: familyData },
    { name: 'Emotional Zone', data: emotionalData },
    { name: 'Fun Zone', data: funData }
  ];

  const allSubcategoriesList = [];
  let totalQuestions = 0;

  allDataSources.forEach(source => {
    if (source.data && source.data.categories && Array.isArray(source.data.categories)) {
      source.data.categories.forEach(category => {
        if (category.subcategories && Array.isArray(category.subcategories)) {
          category.subcategories.forEach(sub => {
            if (sub.questions && Array.isArray(sub.questions) && sub.questions.length > 0) {
              allSubcategoriesList.push({
                id: sub.id,
                name: sub.name,
                questions: sub.questions,
                zoneName: category.name,
                zoneColor: category.color,
                source: source.name
              });
              totalQuestions += sub.questions.length;
            }
          });
        }
      });
    }
  });

  console.log(`📚 Loaded ${totalQuestions} questions from ${allSubcategoriesList.length} subcategories`);
  console.log(`📊 Data sources: ${allDataSources.map(s => s.name).join(', ')}`);
  
  return allSubcategoriesList;
};

// Get next sequential question for daily notifications (cycles through subcategories)
const getNextDailyQuestion = async () => {
  try {
    // Get current subcategory index from storage
    const currentSubcategoryIndexStr = await AsyncStorage.getItem('DAILY_SUBCATEGORY_INDEX_KEY');
    const currentQuestionIndexStr = await AsyncStorage.getItem('DAILY_SUBCATEGORY_QUESTION_INDEX_KEY');
    
    let subcategoryIndex = currentSubcategoryIndexStr ? parseInt(currentSubcategoryIndexStr, 10) : 0;
    let questionIndex = currentQuestionIndexStr ? parseInt(currentQuestionIndexStr, 10) : 0;
    
    // Load all subcategories from ALL JSON data files
    const allSubcategoriesList = loadAllQuestionsFromData();
    
    if (allSubcategoriesList.length === 0) {
      console.warn('⚠️ No subcategories found in JSON data, using fallback');
      return {
        question: "What's one thing you're grateful for today?",
        category: "Daily Reflection",
        zone: "Unknown Zone",
        subcategory: "Unknown"
      };
    }
    
    // Get current subcategory
    const currentSubcategory = allSubcategoriesList[subcategoryIndex % allSubcategoriesList.length];
    const questions = currentSubcategory.questions;
    
    // Get question from current subcategory
    const questionData = {
      question: questions[questionIndex % questions.length],
      category: currentSubcategory.name || "Daily Reflection",
      zone: currentSubcategory.zoneName || "Unknown Zone",
      subcategory: currentSubcategory.name || "Unknown",
      source: currentSubcategory.source || "Unknown"
    };
    
    // Increment question index
    questionIndex = (questionIndex + 1) % questions.length;
    
    // If we've gone through all questions in this subcategory, move to next subcategory
    if (questionIndex === 0) {
      subcategoryIndex = (subcategoryIndex + 1) % allSubcategoriesList.length;
      console.log('🔄 Moving to next subcategory:', allSubcategoriesList[subcategoryIndex].name);
    }
    
    // Store indices for next time
    await AsyncStorage.setItem('DAILY_SUBCATEGORY_INDEX_KEY', subcategoryIndex.toString());
    await AsyncStorage.setItem('DAILY_SUBCATEGORY_QUESTION_INDEX_KEY', questionIndex.toString());
    
    console.log('🔄 Daily subcategory index:', subcategoryIndex);
    console.log('📝 Daily question index:', questionIndex);
    console.log('📂 Source:', questionData.source);
    console.log('🏷️ Zone:', questionData.zone);
    console.log('📂 Subcategory:', questionData.subcategory);
    console.log('❓ Question:', questionData.question);
    
    return questionData;
  } catch (error) {
    console.error('❌ Error getting next daily question:', error);
    return {
      question: "What's one thing you're grateful for today?",
      category: "Daily Reflection",
      zone: "Unknown Zone",
      subcategory: "Unknown"
    };
  }
};

// Get random question from all categories
// Get today's specific question for daily notifications
const getTodayQuestion = () => {
  try {
    if (!Array.isArray(allCategories) || allCategories.length === 0) {
      return {
        question: "What's one thing you're grateful for today?",
        category: "Daily Reflection"
      };
    }

    // Use today's date to consistently select the same question for the day
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Use the date to pick a category and question consistently for today
    const categoryIndex = dayOfYear % allCategories.length;
    const selectedCategory = allCategories[categoryIndex];
    
    // Get all questions from this category
    const allQuestions = [];
    if (selectedCategory.subcategories && Array.isArray(selectedCategory.subcategories)) {
      selectedCategory.subcategories.forEach(sub => {
        if (sub.questions && Array.isArray(sub.questions)) {
          allQuestions.push(...sub.questions);
        }
      });
    }

    if (allQuestions.length === 0) {
      return {
        question: "What's one thing you're grateful for today?",
        category: selectedCategory.name || "Daily Reflection"
      };
    }

    // Use today's date to pick a specific question from this category
    const questionIndex = dayOfYear % allQuestions.length;
    const selectedQuestion = allQuestions[questionIndex];
    
    return {
      question: selectedQuestion.question || selectedQuestion.text || "What's one thing you're grateful for today?",
      category: selectedCategory.name || "Daily Reflection"
    };
  } catch (error) {
    console.error('Error getting today question:', error);
    return {
      question: "What's one thing you're grateful for today?",
      category: "Daily Reflection"
    };
  }
};

// Get random question for weekly notifications
const getRandomWeeklyQuestion = () => {
  try {
    if (!Array.isArray(allCategories) || allCategories.length === 0) {
      return {
        question: "What's your favorite memory from this week?",
        category: "Weekly Reflection"
      };
    }

    // Pick random category for weekly variety
    const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
    
    // Get all questions from this category
    const allQuestions = [];
    if (randomCategory.subcategories && Array.isArray(randomCategory.subcategories)) {
      randomCategory.subcategories.forEach(sub => {
        if (sub.questions && Array.isArray(sub.questions)) {
          allQuestions.push(...sub.questions);
        }
      });
    }

    if (allQuestions.length === 0) {
      return {
        question: "What's your favorite memory from this week?",
        category: randomCategory.name || "Weekly Reflection"
      };
    }

    // Pick completely random question for weekly
    const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    
    return {
      question: randomQuestion.question || randomQuestion.text || "What's your favorite memory from this week?",
      category: randomCategory.name || "Weekly Reflection"
    };
  } catch (error) {
    console.error('Error getting random weekly question:', error);
    return {
      question: "What's your favorite memory from this week?",
      category: "Weekly Reflection"
    };
  }
};

// Get random question from all categories (for other uses)
const getRandomQuestion = () => {
  try {
    if (!Array.isArray(allCategories) || allCategories.length === 0) {
      return {
        question: "What's one thing you're grateful for today?",
        category: "Daily Reflection"
      };
    }

    // Pick random category
    const randomCategory = allCategories[Math.floor(Math.random() * allCategories.length)];
    
    // Get all questions from all subcategories in this category
    const allQuestions = [];
    if (randomCategory.subcategories && Array.isArray(randomCategory.subcategories)) {
      randomCategory.subcategories.forEach(sub => {
        if (sub.questions && Array.isArray(sub.questions)) {
          allQuestions.push(...sub.questions);
        }
      });
    }

    if (allQuestions.length === 0) {
      return {
        question: "What's one thing you're grateful for today?",
        category: randomCategory.name || "Daily Reflection"
      };
    }

    // Pick random question
    const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
    
    return {
      question: randomQuestion.question || randomQuestion.text || "What's one thing you're grateful for today?",
      category: randomCategory.name || "Daily Reflection"
    };
  } catch (error) {
    console.error('Error getting random question:', error);
    return {
      question: "What's one thing you're grateful for today?",
      category: "Daily Reflection"
    };
  }
};

export const scheduleReengageReminder = async () => {
  try {
    if (Platform.OS === 'web') return null;
    // Cancel any existing re-engage reminder
    const existingId = await AsyncStorage.getItem(REENGAGE_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Keep the connection going',
        body: pickSuggestionBody(),
        data: { type: 'reengage' },
        sound: 'default',
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: { 
        type: 'timeInterval',
        hour: 19, 
        minute: 0, 
        repeats: true 
      },
    });
    await AsyncStorage.setItem(REENGAGE_ID_KEY, id);
    return id;
  } catch {}
  return null;
};

// Schedule daily reminder notification at specific time
export const scheduleDailyReminder = async () => {
  try {
    console.log('📅 Scheduling daily reminder for every 24 hours...');
    
    if (Platform.OS === 'web') {
      console.log('Daily reminders not supported on web');
      return null;
    }

    // Get next sequential question for daily reminder
    const nextQuestionData = await getNextDailyQuestion();
    
    // Cancel any existing daily reminders to avoid duplicates
    const existingId = await AsyncStorage.getItem(DAILY_REMINDER_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      console.log('Cancelled existing daily reminder:', existingId);
    }

    // Schedule for every 24 hours at 10:00 AM
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌅 ${nextQuestionData.subcategory || 'Daily Question'}`,
        body: nextQuestionData.question,
        data: { 
          type: 'daily_question',
          category: 'Daily Reminder',
          zone: nextQuestionData.zone,
          subcategory: nextQuestionData.subcategory,
          screen: 'Notifications'
        },
        sound: 'default',
        priority: 'high',
      },
      trigger: {
        hour: 10, // 10:00 AM
        minute: 0,
        repeats: true, // Every 24 hours
      },
    });

    // Store the notification ID
    await AsyncStorage.setItem(DAILY_REMINDER_KEY, id);
    console.log('✅ Daily reminder scheduled successfully (every 24 hours):', id);
    console.log('📋 Zone:', nextQuestionData.zone);
    console.log('📂 Subcategory:', nextQuestionData.subcategory);
    
    return id;
  } catch (error) {
    console.error('❌ Error scheduling daily reminder:', error);
    return null;
  }
};

export const enableDailyReminders = async () => {
  try {
    if (Platform.OS === 'web') {
      // No alert - just return false for web
      return false;
    }
    const current = await Notifications.getPermissionsAsync();
    let status = current?.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req?.status;
    }
    if (status !== 'granted') {
      // No alert - just set to false and return
      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
      return false;
    }
    await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
    await scheduleReengageReminder();
    // No alert - just enable silently
    return true;
  } catch (e) {
    // No alert - just return false
    return false;
  }
};

export const scheduleWeeklyHighlights = async () => {
  try {
    console.log('📅 Scheduling weekly highlights for once per week...');
    
    if (Platform.OS === 'web') return null;
    
    // Get a random question for weekly highlight
    const weeklyQuestionData = await getWeeklyHighlightQuestion();
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Weekly Highlight',
        body: weeklyQuestionData.question,
        data: { 
          type: 'weekly_highlights',
          category: 'Weekly Highlights',
          zone: weeklyQuestionData.zone,
          subcategory: weeklyQuestionData.subcategory,
          screen: 'Notifications'
        },
        sound: 'default', // Enable notification sound
        priority: 'high',
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: { 
        type: 'timeInterval',
        days: 7, // Every 7 days (once per week)
        repeats: true 
      },
    });
    
    console.log('✅ Weekly highlights scheduled successfully (once per week):', id);
    console.log('📋 Zone:', weeklyQuestionData.zone);
    console.log('📂 Subcategory:', weeklyQuestionData.subcategory);
    return id;
  } catch (error) {
    console.error('❌ Error scheduling weekly highlights:', error);
    return null;
  }
};

export const scheduleNewCategoryAlert = async () => {
  try {
    console.log(' New category alerts configured for event-based triggering...');
    
    if (Platform.OS === 'web') return null;
    
    // New category alerts are sent when new categories are added to the app
    // This function just sets up the configuration, doesn't schedule a recurring notification
    const id = 'new-category-alert-config';
    
    console.log(' New category alerts configured (will trigger when new categories are added)');
    
    return id;
  } catch (error) {
    console.error(' Error configuring new category alerts:', error);
    return null;
  }
};

// Function to send new category alert when a new category is actually added
export const sendNewCategoryAlert = async (categoryName, categoryDescription) => {
  try {
    console.log(' Sending new category alert for:', categoryName);
    
    if (Platform.OS === 'web') return null;
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: ' New Category Available!',
        body: `${categoryName}: ${categoryDescription || 'Discover new ways to connect!'}`,
        data: { 
          type: 'new_category',
          category: 'General',
          categoryName: categoryName,
          screen: 'Notifications'
        },
        sound: 'default',
        priority: 'high',
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: null, // Send immediately
    });
    
    console.log(' New category alert sent:', id);
    return id;
  } catch (error) {
    console.error(' Error sending new category alert:', error);
    return null;
  }
};

// Store received notifications for notification screen
let receivedNotifications = [];
let navigationRef = null; // Store navigation reference

// Set navigation reference for use in notification handlers
export const setNavigationRef = (navigation) => {
  navigationRef = navigation;
  console.log('🧭 Navigation reference set for notifications');
};

// Initialize notifications on app start
const initializeNotifications = async () => {
  try {
    const stored = await AsyncStorage.getItem('RECEIVED_NOTIFICATIONS');
    if (stored) {
      receivedNotifications = JSON.parse(stored);
      console.log('Loaded existing notifications:', receivedNotifications.length);
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
    receivedNotifications = [];
  }
};

// Get zone name from category or notification type
const getZoneFromCategory = (category) => {
  const zoneMapping = {
    'relationship': 'Relationship Zone',
    'friendship': 'Friendship Zone', 
    'family': 'Family Zone',
    'emotional': 'Emotional Zone',
    'fun': 'Fun Zone',
    'daily reflection': 'Daily Reflection',
    'weekly reflection': 'Weekly Highlights',
    'general': 'General',
    'daily_question': 'Daily Questions',
    'weekly_highlights': 'Weekly Highlights',
    'new_category': 'New Categories',
    'reengage': 'Reminders',
    'two_second_question': 'Quick Questions'
  };
  
  // Convert category name to zone name
  const lowerCategory = (category || '').toLowerCase();
  
  for (const [key, zone] of Object.entries(zoneMapping)) {
    if (lowerCategory.includes(key)) {
      return zone;
    }
  }
  
  return 'General';
};

// Add notification received listener
Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification received:', notification);
  
  // Get zone information
  const category = notification.request.content.data?.category || 'General';
  const zone = getZoneFromCategory(category);
  
  // Store notification as unread with zone information
  const newNotification = {
    id: Date.now().toString(),
    title: notification.request.content.title,
    body: notification.request.content.body,
    data: {
      ...notification.request.content.data,
      screen: 'Notifications', // Add screen navigation data
      id: Date.now().toString() // Add unique ID for this notification
    },
    timestamp: new Date().toISOString(),
    read: false,
    category: category,
    zone: zone, // Add zone categorization
    type: notification.request.content.data?.type || 'notification'
  };
  
  // Add to received notifications array (newest first)
  receivedNotifications.unshift(newNotification);
  
  // Keep only last 50 notifications to prevent storage bloat
  if (receivedNotifications.length > 50) {
    receivedNotifications = receivedNotifications.slice(0, 50);
  }
  
  // Store in AsyncStorage for persistence and notification screen access
  AsyncStorage.setItem('RECEIVED_NOTIFICATIONS', JSON.stringify(receivedNotifications));
  
  console.log('✅ Added to notification screen:', newNotification.title);
  console.log('🏷️ Zone:', zone);
  console.log('📊 Total notifications:', receivedNotifications.length);
});

// Add notification response listener (when user taps notification)
Notifications.addNotificationResponseReceivedListener(response => {
  console.log('📱 Notification tapped:', response);
  console.log('🧭 Navigating to notification screen...');
  
  // Extract navigation data from notification
  const notificationData = response.notification.request.content.data || {};
  const targetScreen = notificationData.screen || 'Notifications';
  const notificationId = notificationData.id;
  
  // Mark notification as read
  if (notificationId) {
    receivedNotifications = receivedNotifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    AsyncStorage.setItem('RECEIVED_NOTIFICATIONS', JSON.stringify(receivedNotifications));
    console.log('📖 Marked as read:', notificationId);
  }
  
  // Navigate to the appropriate screen based on notification data
  if (navigationRef && navigationRef.current) {
    console.log(`🎯 App is open - navigating to ${targetScreen} screen`);
    navigationRef.current.navigate(targetScreen, {
      notificationId: notificationId,
      notificationData: notificationData
    });
  } else {
    console.log(`🚀 App was closed - React Navigation will handle navigation to ${targetScreen} screen`);
    // When app is closed, React Navigation automatically handles the navigation
    // The notification will open the app and navigate to the specified screen
    // Add a small delay to ensure navigation completes
    setTimeout(() => {
      console.log('⏰ Navigation timeout completed');
    }, 500);
  }
  
  console.log('✅ Navigation triggered to:', targetScreen);
});

// Get stored notifications with automatic initialization
export const getStoredNotifications = async () => {
  await initializeNotifications(); // Ensure notifications are loaded
  return receivedNotifications;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    receivedNotifications = receivedNotifications.map(notif => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    await AsyncStorage.setItem('RECEIVED_NOTIFICATIONS', JSON.stringify(receivedNotifications));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Clear all notifications
export const clearAllNotifications = async () => {
  try {
    receivedNotifications = [];
    await AsyncStorage.removeItem('RECEIVED_NOTIFICATIONS');
    console.log('🗑️ Cleared all notifications');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

// Manually add notification to screen (for testing or custom notifications)
export const addNotificationToScreen = async (title, body, category = 'General', type = 'custom') => {
  try {
    // Get zone information
    const zone = getZoneFromCategory(category);
    
    const newNotification = {
      id: Date.now().toString(),
      title,
      body,
      data: { type, category },
      timestamp: new Date().toISOString(),
      read: false,
      category: category,
      zone: zone // Add zone categorization
    };
    
    receivedNotifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (receivedNotifications.length > 50) {
      receivedNotifications = receivedNotifications.slice(0, 50);
    }
    
    await AsyncStorage.setItem('RECEIVED_NOTIFICATIONS', JSON.stringify(receivedNotifications));
    console.log('➕ Manually added notification:', title);
    console.log('🏷️ Zone:', zone);
    
    return newNotification;
  } catch (error) {
    console.error('Error adding notification to screen:', error);
    return null;
  }
};

// Get unread count
export const getUnreadCount = async () => {
  await initializeNotifications();
  return receivedNotifications.filter(notif => !notif.read).length;
};

// Schedule continuous notifications every 2 seconds for daily testing
export const scheduleTwoSecondNotifications = async () => {
  try {
    if (Platform.OS === 'web') return null;
    
    // Cancel any existing 2-second notifications
    const existingId = await AsyncStorage.getItem('TWO_SECOND_NOTIF_ID');
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }
    
    // Get random question from all categories for variety
    const randomQuestionData = getRandomQuestion();
    
    // Schedule notification every 2 seconds continuously
    const notificationId = Date.now().toString();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡ Quick Question',
        body: randomQuestionData.question,
        data: { 
          type: 'two_second_question',
          category: randomQuestionData.category,
          id: notificationId,
          continuous: true
        },
        sound: 'default',
        priority: 'high',
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: { 
        type: 'timeInterval',
        seconds: 2, // Every 2 seconds
        repeats: true 
      },
    });
    
    // Store the notification ID for cancellation
    await AsyncStorage.setItem('TWO_SECOND_NOTIF_ID', id);
    await AsyncStorage.setItem(TWO_SECOND_NOTIF_KEY, 'true');
    
    console.log('⚡ Two-second notifications scheduled:', id);
    console.log('Question category:', randomQuestionData.category);
    return id;
  } catch (error) {
    console.error('Error scheduling two-second notifications:', error);
    return null;
  }
};

// Cancel two-second notifications
export const cancelTwoSecondNotifications = async () => {
  try {
    const existingId = await AsyncStorage.getItem('TWO_SECOND_NOTIF_ID');
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      await AsyncStorage.removeItem('TWO_SECOND_NOTIF_ID');
    }
    await AsyncStorage.setItem(TWO_SECOND_NOTIF_KEY, 'false');
    console.log('⏹️ Two-second notifications cancelled');
    return true;
  } catch (error) {
    console.error('Error cancelling two-second notifications:', error);
    return false;
  }
};

// Send immediate Firebase push notification for 2-second interval
export const sendTwoSecondPushNotification = async () => {
  try {
    // Get random question from all categories
    const randomQuestionData = getRandomQuestion();
    
    // Get the Expo push token
    const token = await getFCMToken();
    
    if (!token || token.startsWith('mock-token')) {
      console.log('Using local notification - Firebase not configured');
      return await sendImmediateTwoSecondNotification();
    }
    
    // Send real Firebase push notification via Expo's push service
    const message = {
      to: token,
      sound: 'default',
      title: '⚡ Quick Question',
      body: randomQuestionData.question,
      data: { 
        type: 'two_second_question',
        immediate: true,
        category: randomQuestionData.category,
        continuous: true
      },
      priority: 'high',
      channelId: 'two-second-questions',
      ttl: 3600,
      badge: 1,
      // Add app logo for push notifications
      icon: 'https://i.imgur.com/your-logo-url.png',
    };
    
    // Send to Expo's push notification service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    console.log('⚡ Two-second push notification sent:', result);
    console.log('Question category:', randomQuestionData.category);
    
    return result;
  } catch (error) {
    console.error('Error sending two-second push notification:', error);
    // Fallback to local notification
    return await sendImmediateTwoSecondNotification();
  }
};

// Send immediate two-second notification for testing
export const sendImmediateTwoSecondNotification = async () => {
  try {
    if (Platform.OS === 'web') return null;
    
    // Get random question from all categories
    const randomQuestionData = getRandomQuestion();
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡ Quick Question',
        body: randomQuestionData.question,
        data: { 
          type: 'two_second_question',
          immediate: true,
          category: randomQuestionData.category,
          continuous: true
        },
        sound: 'default',
        priority: 'high',
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: null, // Show immediately
    });
    
    console.log('⚡ Immediate two-second notification sent:', id);
    console.log('Question category:', randomQuestionData.category);
    return id;
  } catch (error) {
    console.error('Error sending immediate two-second notification:', error);
    return null;
  }
};

// Enable two-second notifications with Firebase support
export const enableTwoSecondNotifications = async () => {
  try {
    console.log('⚡ Enabling two-second notifications...');
    
    // Request permissions
    const hasPermission = await requestFirebasePermission();
    console.log('Firebase permission result:', hasPermission);
    
    if (!hasPermission) {
      // No alert - just return false
      return false;
    }
    
    // Subscribe to Firebase topic
    await subscribeToTopic('two_second_questions');
    
    // Save preference
    await AsyncStorage.setItem(TWO_SECOND_NOTIF_KEY, 'true');
    
    // Schedule local notifications for continuous delivery
    await scheduleTwoSecondNotifications();
    
    // Send immediate test notification
    await sendTwoSecondPushNotification();
    
    // No alert - just enable silently
    return true;
  } catch (error) {
    console.error('Error enabling two-second notifications:', error);
    // Fallback to local only
    try {
      await scheduleTwoSecondNotifications();
      await sendImmediateTwoSecondNotification();
      await AsyncStorage.setItem(TWO_SECOND_NOTIF_KEY, 'true');
      // No alert - just enable silently
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      // No alert - just return false
      return false;
    }
  }
};

// Disable two-second notifications
export const disableTwoSecondNotifications = async () => {
  try {
    console.log('⏹️ Disabling two-second notifications...');
    
    // Cancel scheduled notifications
    await cancelTwoSecondNotifications();
    
    // Unsubscribe from Firebase topic
    await unsubscribeFromTopic('two_second_questions');
    
    // Update preference
    await AsyncStorage.setItem(TWO_SECOND_NOTIF_KEY, 'false');
    
    // No alert - just disable silently
    return true;
  } catch (error) {
    console.error('Error disabling two-second notifications:', error);
    return false;
  }
};

// Check if two-second notifications are enabled
export const isTwoSecondNotificationsEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(TWO_SECOND_NOTIF_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking two-second notification status:', error);
    return false;
  }
};
export const scheduleDailyQuestionReminder = async () => {
  try {
    if (Platform.OS === 'web') return null;
    
    // Get next sequential question from all categories
    const nextQuestionData = await getNextDailyQuestion();
    
    // Schedule notification every 24 hours for daily reminder
    const notificationId = Date.now().toString();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Daily Question',
        body: nextQuestionData.question,
        data: { 
          type: 'daily_question',
          category: nextQuestionData.category,
          id: notificationId // Add ID for tracking
        },
        sound: 'default', // Enable notification sound
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: { 
        type: 'timeInterval',
        hours: 24, // 24 hours for daily reminder
        repeats: true 
      }, // Every 24 hours
    });
    
    console.log('Daily question scheduled every 24 hours:', id);
    console.log('Question index:', await AsyncStorage.getItem(DAILY_QUESTION_INDEX_KEY));
    console.log('Question category:', nextQuestionData.category);
    return id;
  } catch (error) {
    console.error('Error scheduling daily question reminder:', error);
    return null;
  }
};

// Send real Firebase push notification immediately
export const sendFirebasePushNotification = async () => {
  try {
    // Get today's specific question from all categories
    const todayQuestionData = getTodayQuestion();
    
    // Get the Expo push token
    const token = await getFCMToken();
    
    if (!token || token.startsWith('mock-token')) {
      console.log('Using local notification - Firebase not configured');
      return await sendImmediateDailyNotification();
    }
    
    // Send real Firebase push notification via your Cloud Function
    const response = await fetch('https://us-central1-unfold-cards-8f621.cloudfunctions.net/sendToDevice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        title: '🌅 Daily Question',
        body: todayQuestionData.question,
        notificationData: {
          type: 'daily_question',
          immediate: true,
          category: todayQuestionData.category,
          screen: 'Notifications',
          timestamp: new Date().toISOString()
        }
      }),
    });
    
    const result = await response.json();
    console.log('🌅 Real Firebase daily notification sent:', result);
    console.log('Question category:', todayQuestionData.category);
    
    return result;
  } catch (error) {
    console.error('Error sending Firebase daily notification:', error);
    // Fallback to local notification
    return await sendImmediateDailyNotification();
  }
};

// Send real Firebase push notification for weekly highlights
export const sendWeeklyPushNotification = async () => {
  try {
    // Get random question for weekly variety
    const weeklyQuestionData = getRandomWeeklyQuestion();
    
    // Get the Expo push token
    const token = await getFCMToken();
    
    if (!token || token.startsWith('mock-token')) {
      console.log('Using local notification - Firebase not configured');
      return await sendImmediateWeeklyNotification();
    }
    
    // Send real Firebase push notification via your Cloud Function
    const response = await fetch('https://us-central1-unfold-cards-8f621.cloudfunctions.net/sendToDevice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        title: '📊 Weekly Question',
        body: weeklyQuestionData.question,
        notificationData: {
          type: 'weekly_highlights',
          immediate: true,
          category: weeklyQuestionData.category,
          screen: 'Notifications',
          timestamp: new Date().toISOString()
        }
      }),
    });
    
    const result = await response.json();
    console.log('📊 Real Firebase weekly notification sent:', result);
    console.log('Question category:', weeklyQuestionData.category);
    
    return result;
  } catch (error) {
    console.error('Error sending Firebase weekly notification:', error);
    // Fallback to local notification
    return await sendImmediateWeeklyNotification();
  }
};

// Send real Firebase push notification for new category alerts
export const sendNewCategoryPushNotification = async () => {
  try {
    // Get the Expo push token
    const token = await getFCMToken();
    
    if (!token || token.startsWith('mock-token')) {
      console.log('Using local notification - Firebase not configured');
      return await sendImmediateNewCategoryNotification();
    }
    
    // Send real Firebase push notification via your Cloud Function
    const response = await fetch('https://us-central1-unfold-cards-8f621.cloudfunctions.net/sendToDevice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        title: 'New Category Available!',
        body: 'A fresh card category has been added. Discover new ways to connect!',
        notificationData: {
          type: 'new_category',
          immediate: true,
          screen: 'Notifications',
          timestamp: new Date().toISOString()
        }
      }),
    });
    
    const result = await response.json();
    console.log('🆕 Real Firebase new category notification sent:', result);
    
    return result;
  } catch (error) {
    console.error('Error sending Firebase new category notification:', error);
    // Fallback to local notification
    return await sendImmediateNewCategoryNotification();
  }
};

// Send immediate new category notification for testing
export const sendImmediateNewCategoryNotification = async () => {
  try {
    if (Platform.OS === 'web') return null;
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🆕 New Category Available!',
        body: 'A fresh card category has been added. Discover new ways to connect!',
        data: { 
          type: 'new_category',
          immediate: true,
          category: 'General'
        },
        sound: 'default',
        priority: 'high',
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: null, // Show immediately
    });
    
    console.log('🆕 Immediate new category notification sent:', id);
    return id;
  } catch (error) {
    console.error('Error sending immediate new category notification:', error);
    return null;
  }
};

// Send immediate daily notification for testing
export const sendImmediateDailyNotification = async () => {
  try {
    if (Platform.OS === 'web') return null;
    
    // Cancel any existing immediate notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Get today's specific question from all categories
    const todayQuestionData = await getNextDailyQuestion();
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌅 ${todayQuestionData.subcategory || 'Daily Question'}`,
        body: todayQuestionData.question,
        data: { 
          type: 'daily_question', 
          immediate: true,
          category: 'Daily Reminder',
          zone: todayQuestionData.zone,
          subcategory: todayQuestionData.subcategory
        },
        sound: 'default', // Enable notification sound
        priority: 'high', // High priority for immediate delivery
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: null, // Show immediately
    });
    
    console.log('🌅 Immediate daily notification sent:', id);
    console.log('Zone:', todayQuestionData.zone);
    console.log('Subcategory:', todayQuestionData.subcategory);
    console.log('Question:', todayQuestionData.question);
    return id;
  } catch (error) {
    console.error('Error sending immediate daily notification:', error);
    return null;
  }
};
// Send immediate weekly notification for testing
export const sendImmediateWeeklyNotification = async () => {
  try {
    if (Platform.OS === 'web') return null;
    
    // Cancel any existing immediate notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Get a weekly highlight question
    const weeklyQuestionData = await getWeeklyHighlightQuestion();
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Weekly Highlight',
        body: weeklyQuestionData.question,
        data: { 
          type: 'weekly_highlights', 
          immediate: true,
          category: 'Weekly Highlights'
        },
        sound: 'default', // Enable notification sound
        priority: 'high', // High priority for immediate delivery
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: null, // Show immediately
    });
    
    console.log('📊 Immediate weekly notification sent:', id);
    console.log('Weekly question category:', weeklyQuestionData.category);
    console.log('Weekly question:', weeklyQuestionData.question);
    return id;
  } catch (error) {
    console.error('Error sending immediate weekly notification:', error);
    return null;
  }
};

// Get weekly highlight question
const getWeeklyHighlightQuestion = async () => {
  try {
    // Load all questions from ALL JSON data files
    const allSubcategoriesList = loadAllQuestionsFromData();
    
    // Get all questions for random selection
    const allQuestions = [];
    
    allSubcategoriesList.forEach(sub => {
      sub.questions.forEach(question => {
        allQuestions.push({
          question: question, // Direct string from JSON
          category: sub.zoneName || "Weekly Reflection",
          subcategory: sub.name || "Unknown",
          source: sub.source || "Unknown"
        });
      });
    });
    
    console.log('📈 Total weekly questions loaded:', allQuestions.length);
    
    if (allQuestions.length === 0) {
      console.warn('⚠️ No weekly questions found in JSON data, using fallback');
      return {
        question: "What's been your biggest insight this week?",
        category: "Weekly Reflection",
        zone: "Unknown Zone",
        subcategory: "Unknown"
      };
    }
    
    // Pick a random question for weekly highlight
    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    const weeklyQuestionData = allQuestions[randomIndex];
    
    console.log('🎯 Weekly question source:', weeklyQuestionData.source);
    console.log('🏷️ Weekly zone:', weeklyQuestionData.category);
    console.log('📂 Weekly subcategory:', weeklyQuestionData.subcategory);
    console.log('📝 Weekly question:', weeklyQuestionData.question);
    
    return weeklyQuestionData;
  } catch (error) {
    console.error('❌ Error getting weekly highlight question:', error);
    return {
      question: "What's been your biggest insight this week?",
      category: "Weekly Reflection",
      zone: "Unknown Zone",
      subcategory: "Unknown"
    };
  }
};

export const requestFirebasePermission = async () => {
  try {
    // For Expo, use expo-notifications for permissions
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      console.log('Notification permissions granted');
      return true;
    }
    
    // Request permissions
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    const granted = newStatus === 'granted';
    console.log('Permission request result:', newStatus);
    return granted;
  } catch (error) {
    console.error('Permission error:', error);
    return false;
  }
};

// Get real Expo push token for Firebase Cloud Messaging
export const getFCMToken = async () => {
  try {
    console.log('🔍 Getting Expo push token for Firebase...');
    
    // Request permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('❌ Notification permissions denied');
        return null;
      }
    }
    
    // Get Expo push token with proper configuration
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: undefined // Let Expo handle automatically
    });
    
    if (token && token.data) {
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token.data);
      console.log('🎉 SUCCESS! Expo Push Token obtained:', token.data);
      console.log('📋 Use this token in Firebase Console → Messaging → Test on device');
      return token.data;
    }
    
    console.log('⚠️ No token received from Expo');
    return null;
    
  } catch (error) {
    console.error('❌ Expo token method failed:', error.message);
    
    // Fallback for development
    if (__DEV__) {
      const mockToken = `ExponentPushToken[${Math.random().toString(36).substr(2, 15)}]`;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, mockToken);
      console.log('🔧 Using development mock token:', mockToken);
      return mockToken;
    }
    
    // Web fallback
    if (Platform.OS === 'web') {
      const mockToken = `web-mock-token-${Date.now()}`;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, mockToken);
      console.log('🌐 Using web mock token:', mockToken);
      return mockToken;
    }
    
    return null;
  }
};

export const subscribeToTopic = async (topic) => {
  try {
    // For Expo, topic subscriptions are handled differently
    // We'll store topic preferences locally and handle them on the backend
    console.log(`Topic subscription stored locally: ${topic}`);
    await AsyncStorage.setItem(`topic_${topic}`, 'subscribed');
    return true;
  } catch (error) {
    console.error(`Error storing topic subscription ${topic}:`, error);
    return true;
  }
};

export const unsubscribeFromTopic = async (topic) => {
  try {
    // For Expo, remove topic preferences locally
    console.log(`Topic subscription removed locally: ${topic}`);
    await AsyncStorage.removeItem(`topic_${topic}`);
    return true;
  } catch (error) {
    console.error(`Error removing topic subscription ${topic}:`, error);
    return true;
  }
};

// Initialize Firebase messaging and handle background messages
export const initializeFirebaseMessaging = async () => {
  try {
    console.log('🔧 Initializing Firebase Messaging for Expo...');
    
    // Request permissions first
    const hasPermission = await requestFirebasePermission();
    if (!hasPermission) {
      console.log('❌ Notification permissions not granted');
      return null;
    }

    // Get Expo push token for Firebase
    const token = await getFCMToken();
    if (!token) {
      console.log('⚠️ Could not get Expo push token');
      return null;
    }

    console.log('📱 Setting up notification listeners for token:', token);

    // Set up notification listeners for Firebase messages
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Firebase notification received in foreground:', notification);
      
      // Add to notification screen
      const notificationData = notification.request.content.data || {};
      addNotificationToScreen(
        notification.request.content.title,
        notification.request.content.body,
        notificationData.category || 'Firebase',
        notificationData.type || 'firebase'
      );
    });

    // Handle notification responses (when user taps)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('🔗 Firebase notification tapped:', response);
      
      // Extract navigation data
      const notificationData = response.notification.request.content.data || {};
      const targetScreen = notificationData.screen || 'Notifications';
      
      // Navigate to appropriate screen
      if (navigationRef && navigationRef.current) {
        navigationRef.current.navigate(targetScreen, {
          notificationData: notificationData
        });
      }
    });

    console.log('✅ Firebase Messaging initialized successfully');
    console.log('📱 Push token:', token);
    
    // Return cleanup function
    return () => {
      if (foregroundSubscription?.remove) foregroundSubscription.remove();
      if (responseSubscription?.remove) responseSubscription.remove();
    };
    
  } catch (error) {
    console.error('❌ Error initializing Firebase Messaging:', error);
    return null;
  }
};

// Notification preference management with Firebase topics
export const updateNotificationPreferences = async (preferences) => {
  try {
    const { dailyReminders, weeklyHighlights, newCategoryAlerts } = preferences;

    // Subscribe/unsubscribe from Firebase topics based on preferences
    if (dailyReminders) {
      await subscribeToTopic('daily_reminders');
    } else {
      await unsubscribeFromTopic('daily_reminders');
    }

    if (weeklyHighlights) {
      await subscribeToTopic('weekly_highlights');
    } else {
      await unsubscribeFromTopic('weekly_highlights');
    }

    if (newCategoryAlerts) {
      await subscribeToTopic('new_category_alerts');
    } else {
      await unsubscribeFromTopic('new_category_alerts');
    }

    // Save preferences locally
    await AsyncStorage.setItem(DAILY_REMINDER_KEY, dailyReminders.toString());
    await AsyncStorage.setItem(WEEKLY_HIGHLIGHTS_KEY, weeklyHighlights.toString());
    await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, newCategoryAlerts.toString());

    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
};

// Enhanced Firebase notification handlers with single test notification
export const enableDailyRemindersWithFirebase = async () => {
  try {
    console.log('🌅 Enabling daily reminders with real Firebase...');
    
    // Request permissions
    const hasPermission = await requestFirebasePermission();
    console.log('Firebase permission result:', hasPermission);
    
    if (!hasPermission) {
      // Permission denied - no alert, just return false
      return false;
    }
    
    // Get real Expo push token
    const token = await getFCMToken();
    if (!token) {
      console.log('⚠️ No Expo push token available, using local notifications only');
      await scheduleDailyReminder();
      await sendImmediateDailyNotification();
      await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'true');
      // No alert - just enable silently
      return true;
    }
    
    // Subscribe to Firebase topic (stored locally for backend handling)
    await subscribeToTopic('daily_reminders');
    
    // Save preference
    await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'true');
    
    // Schedule local notification as backup
    await scheduleDailyReminder();
    
    // Send immediate TEST notification (only once)
    await sendImmediateDailyNotification();
    
    // No alert - just enable silently
    return true;
  } catch (error) {
    console.error('Error enabling daily reminders:', error);
    // Fallback to local only
    try {
      await scheduleDailyReminder();
      await sendImmediateDailyNotification();
      await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'true');
      // No alert - just enable silently
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      // No alert - just return false
      return false;
    }
  }
};

export const enableWeeklyHighlightsWithFirebase = async () => {
  try {
    console.log('📊 Enabling weekly highlights with real Firebase...');
    
    // Request permissions
    const hasPermission = await requestFirebasePermission();
    console.log('Firebase permission result:', hasPermission);
    
    if (!hasPermission) {
      // Permission denied - no alert, just return false
      return false;
    }
    
    // Get real Expo push token
    const token = await getFCMToken();
    if (!token) {
      console.log('⚠️ No Expo push token available, using local notifications only');
      await scheduleWeeklyHighlights();
      await sendImmediateWeeklyNotification();
      await AsyncStorage.setItem(WEEKLY_HIGHLIGHTS_KEY, 'true');
      // No alert - just enable silently
      return true;
    }
    
    // Subscribe to Firebase topic (stored locally for backend handling)
    await subscribeToTopic('weekly_highlights');
    
    // Save preference
    await AsyncStorage.setItem(WEEKLY_HIGHLIGHTS_KEY, 'true');
    
    // Schedule local notification as backup
    await scheduleWeeklyHighlights();
    
    // Send immediate TEST notification (only once)
    await sendImmediateWeeklyNotification();
    
    // No alert - just enable silently
    return true;
  } catch (error) {
    console.error('Error enabling weekly highlights:', error);
    // Fallback to local only
    try {
      await scheduleWeeklyHighlights();
      await sendImmediateWeeklyNotification();
      await AsyncStorage.setItem(WEEKLY_HIGHLIGHTS_KEY, 'true');
      // No alert - just enable silently
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      // No alert - just return false
      return false;
    }
  }
};

export const enableNewCategoryAlertsWithFirebase = async () => {
  try {
    console.log('🆕 Enabling new category alerts with real Firebase...');
    
    // Request permissions
    const hasPermission = await requestFirebasePermission();
    console.log('Firebase permission result:', hasPermission);
    
    if (!hasPermission) {
      // Permission denied - no alert, just return false
      return false;
    }
    
    // Get real Expo push token
    const token = await getFCMToken();
    if (!token) {
      console.log('⚠️ No Expo push token available, using local notifications only');
      await scheduleNewCategoryAlert();
      await sendImmediateNewCategoryNotification();
      await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, 'true');
      // No alert - just enable silently
      return true;
    }
    
    // Subscribe to Firebase topic (stored locally for backend handling)
    await subscribeToTopic('new_category_alerts');
    
    // Save preference
    await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, 'true');
    
    // Schedule local notification as backup
    await scheduleNewCategoryAlert();
    
    // Send immediate TEST notification (only once)
    await sendImmediateNewCategoryNotification();
    
    // No alert - just enable silently
    return true;
  } catch (error) {
    console.error('Error enabling new category alerts:', error);
    // Fallback to local only
    try {
      await scheduleNewCategoryAlert();
      await sendImmediateNewCategoryNotification();
      await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, 'true');
      // No alert - just enable silently
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      // No alert - just return false
      return false;
    }
  }
};
