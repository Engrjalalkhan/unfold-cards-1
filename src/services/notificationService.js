import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { messaging, Notifications } from '../config/firebase';
import { allCategories } from '../data/decks';
import { 
  NOTIF_ENABLED_KEY, 
  REENGAGE_ID_KEY,
  DAILY_REMINDER_KEY,
  WEEKLY_HIGHLIGHTS_KEY,
  NEW_CATEGORY_ALERT_KEY,
  FCM_TOKEN_KEY,
  TWO_SECOND_NOTIF_KEY
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

export const enableDailyReminders = async () => {
  try {
    if (Platform.OS === 'web') {
      Alert.alert('Notifications on Web', 'Notifications are not available in this web preview. Use a device build to receive reminders.');
      return false;
    }
    const current = await Notifications.getPermissionsAsync();
    let status = current?.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req?.status;
    }
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Enable notifications in system settings to receive reminders.');
      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
      return false;
    }
    await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
    await scheduleReengageReminder();
    Alert.alert('Reminders enabled', 'We\'ll nudge you if you\'re away for a day.');
    return true;
  } catch (e) {
    Alert.alert('Notifications error', 'Something went wrong enabling reminders.');
    return false;
  }
};

export const scheduleWeeklyHighlights = async () => {
  try {
    if (Platform.OS === 'web') return null;
    
    // Get random question from all categories for weekly highlight
    const randomQuestionData = getRandomWeeklyQuestion();
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Weekly Highlights',
        body: `This week's question: ${randomQuestionData.question}`,
        data: { 
          type: 'weekly_highlights',
          category: randomQuestionData.category,
          question: randomQuestionData.question
        },
        sound: 'default', // Enable notification sound
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: { 
        type: 'timeInterval',
        weekday: 1, 
        hour: 10, 
        minute: 0, 
        repeats: true 
      }, // Monday at 10 AM
    });
    
    console.log('Weekly highlights scheduled:', id);
    console.log('Question category:', randomQuestionData.category);
    return id;
  } catch {}
  return null;
};

export const scheduleNewCategoryAlert = async () => {
  try {
    if (Platform.OS === 'web') return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Category Available!',
        body: 'A fresh card category has been added. Discover new ways to connect!',
        data: { type: 'new_category' },
        sound: 'default', // Enable notification sound
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: { 
        type: 'timeInterval',
        hour: 12, 
        minute: 0, 
        repeats: false 
      }, // One-time notification at noon
    });
    return id;
  } catch {}
  return null;
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
      Alert.alert('Permission needed', 'Enable notifications in system settings to receive two-second questions.');
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
    
    Alert.alert('⚡ Two-second notifications enabled', 'You will receive questions every 2 seconds. Test notification sent!');
    return true;
  } catch (error) {
    console.error('Error enabling two-second notifications:', error);
    // Fallback to local only
    try {
      await scheduleTwoSecondNotifications();
      await sendImmediateTwoSecondNotification();
      await AsyncStorage.setItem(TWO_SECOND_NOTIF_KEY, 'true');
      Alert.alert('⚡ Two-second notifications enabled', 'Local notifications enabled. Test notification sent!');
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      Alert.alert('Notifications error', 'Something went wrong enabling two-second notifications.');
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
    
    Alert.alert('⏹️ Two-second notifications disabled', 'You will no longer receive questions every 2 seconds.');
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
    
    // Get random question from all categories for variety
    const randomQuestionData = getRandomQuestion();
    
    // Schedule notification every 2 seconds for testing
    const notificationId = Date.now().toString();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Daily Question',
        body: randomQuestionData.question,
        data: { 
          type: 'daily_question',
          category: randomQuestionData.category,
          id: notificationId // Add ID for tracking
        },
        sound: 'default', // Enable notification sound
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: { 
        type: 'timeInterval',
        seconds: 2, // 2 seconds for testing
        repeats: true 
      }, // Every 2 seconds
    });
    
    console.log('Daily question scheduled every 2 seconds:', id);
    console.log('Question category:', randomQuestionData.category);
    return id;
  } catch (error) {
    console.error('Error scheduling daily question reminder:', error);
    return null;
  }
};

// Send real Firebase push notification immediately
export const sendFirebasePushNotification = async () => {
  try {
    // Get random question from all categories
    const randomQuestionData = getRandomQuestion();
    
    // Get the Expo push token
    const token = await getFCMToken();
    
    if (!token || token.startsWith('mock-token')) {
      console.log('Using local notification - Firebase not configured');
      return await sendImmediateDailyNotification();
    }
    
    // Send real Firebase push notification via Expo's push service
    const message = {
      to: token,
      sound: 'default',
      title: '🌅 Daily Question',
      body: randomQuestionData.question,
      data: { 
        type: 'daily_question', 
        immediate: true,
        category: randomQuestionData.category
      },
      priority: 'high',
      channelId: 'daily-questions', // Custom channel for top priority
      ttl: 3600, // Time to live: 1 hour
      badge: 1, // Show badge count
      // Add app logo for push notifications
      icon: 'https://i.imgur.com/your-logo-url.png', // For push notifications, use URL
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
    console.log('Firebase push notification sent:', result);
    console.log('Question category:', randomQuestionData.category);
    
    return result;
  } catch (error) {
    console.error('Error sending Firebase push notification:', error);
    // Fallback to local notification
    return await sendImmediateDailyNotification();
  }
};

// Send immediate daily notification for testing
export const sendImmediateDailyNotification = async () => {
  try {
    if (Platform.OS === 'web') return null;
    
    // Cancel any existing immediate notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Get today's specific question from all categories
    const todayQuestionData = getTodayQuestion();
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌅 Daily Question',
        body: todayQuestionData.question,
        data: { 
          type: 'daily_question', 
          immediate: true,
          category: todayQuestionData.category
        },
        sound: 'default', // Enable notification sound
        priority: 'high', // High priority for immediate delivery
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: null, // Show immediately
    });
    
    console.log('Immediate daily notification sent:', id);
    console.log('Question category:', randomQuestionData.category);
    return id;
  } catch (error) {
    console.error('Error sending immediate daily notification:', error);
    return null;
  }
};

// Firebase Cloud Messaging functions for Expo
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

export const getFCMToken = async () => {
  try {
    // Try to get real Expo push token using Firebase messaging
    if (messaging) {
      const token = await Notifications.getExpoPushTokenAsync();
      if (token && token.data) {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token.data);
        console.log('Real Expo Push Token:', token.data);
        return token.data;
      }
    }
    
    // Fallback to mock token if Firebase not available
    const mockToken = `mock-token-${Date.now()}`;
    await AsyncStorage.setItem(FCM_TOKEN_KEY, mockToken);
    console.log('Using mock token:', mockToken);
    return mockToken;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    // Fallback to mock token
    const mockToken = `mock-token-${Date.now()}`;
    await AsyncStorage.setItem(FCM_TOKEN_KEY, mockToken);
    console.log('Using mock token due to error:', mockToken);
    return mockToken;
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

export const initializeFirebaseMessaging = async () => {
  try {
    console.log('Initializing Expo notifications (Firebase messaging disabled for Expo compatibility)');
    
    // For Expo, we'll use Expo's notification system only
    // Firebase Web SDK causes issues with Expo
    const hasPermission = await requestFirebasePermission();
    if (!hasPermission) {
      console.log('Notification permissions not granted');
      return null;
    }

    // Get Expo push token
    await getFCMToken();

    // Set up notification listener for Expo
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Return unsubscribe function
    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  } catch (error) {
    console.error('Error initializing notifications:', error);
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

// Enhanced notification functions that work with both local and push notifications
export const enableDailyRemindersWithFirebase = async () => {
  try {
    console.log('Enabling daily reminders...');
    
    // Try Firebase first, fallback to local
    const hasPermission = await requestFirebasePermission();
    console.log('Firebase permission result:', hasPermission);
    
    // Subscribe to Firebase topic (if available)
    await subscribeToTopic('daily_reminders');
    
    // Save preference
    await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'true');
    
    // Schedule local notification as fallback
    await scheduleDailyQuestionReminder();
    
    // Send immediate Firebase push notification
    await sendFirebasePushNotification();
    
    Alert.alert('Daily reminders enabled', 'You\'ll receive daily questions via notification. Test notification sent!');
    return true;
  } catch (error) {
    console.error('Error enabling daily reminders:', error);
    // Fallback to local only
    try {
      await scheduleDailyQuestionReminder();
      await sendImmediateDailyNotification();
      await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'true');
      Alert.alert('Daily reminders enabled', 'Local notifications enabled. Test notification sent!');
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      Alert.alert('Notifications error', 'Something went wrong enabling daily reminders.');
      return false;
    }
  }
};

export const enableWeeklyHighlightsWithFirebase = async () => {
  try {
    console.log('Enabling weekly highlights...');
    
    // Try Firebase first, fallback to local
    const hasPermission = await requestFirebasePermission();
    console.log('Firebase permission result:', hasPermission);
    
    // Subscribe to Firebase topic (if available)
    await subscribeToTopic('weekly_highlights');
    
    // Save preference
    await AsyncStorage.setItem(WEEKLY_HIGHLIGHTS_KEY, 'true');
    
    // Schedule local notification as fallback
    await scheduleWeeklyHighlights();
    
    Alert.alert('Weekly highlights enabled', 'You\'ll receive weekly highlights via notification.');
    return true;
  } catch (error) {
    console.error('Error enabling weekly highlights:', error);
    // Fallback to local only
    try {
      await scheduleWeeklyHighlights();
      await AsyncStorage.setItem(WEEKLY_HIGHLIGHTS_KEY, 'true');
      Alert.alert('Weekly highlights enabled', 'Local notifications enabled.');
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      Alert.alert('Notifications error', 'Something went wrong enabling weekly highlights.');
      return false;
    }
  }
};

export const enableNewCategoryAlertsWithFirebase = async () => {
  try {
    console.log('Enabling new category alerts...');
    
    // Try Firebase first, fallback to local
    const hasPermission = await requestFirebasePermission();
    console.log('Firebase permission result:', hasPermission);
    
    // Subscribe to Firebase topic (if available)
    await subscribeToTopic('new_category_alerts');
    
    // Save preference
    await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, 'true');
    
    // Schedule local notification as fallback
    await scheduleNewCategoryAlert();
    
    Alert.alert('New category alerts enabled', 'You\'ll be notified about new categories.');
    return true;
  } catch (error) {
    console.error('Error enabling new category alerts:', error);
    // Fallback to local only
    try {
      await scheduleNewCategoryAlert();
      await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, 'true');
      Alert.alert('New category alerts enabled', 'Local notifications enabled.');
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      Alert.alert('Notifications error', 'Something went wrong enabling new category alerts.');
      return false;
    }
  }
};
