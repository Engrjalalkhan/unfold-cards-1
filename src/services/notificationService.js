import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { messaging } from '../config/firebase';
import { getSubcategoryById } from '../data/decks';
import { zones, allSubcategories } from '../data/decks';
import { StatsManager } from '../utils/statsManager';
import { StreakManager } from '../utils/streakManager';

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
  DAILY_REMINDER_ID_KEY,
  NEW_CATEGORY_ALERT_KEY,
  FCM_TOKEN_KEY,
  DAILY_QUESTION_INDEX_KEY,
  FAVORITES_STORAGE_KEY
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

// Get random question from all 600 questions for immediate notification
const getRandomQuestionFromAllData = () => {
  try {
    // Load all questions from all JSON data files
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
    
    // Pick a random subcategory
    const randomSubcategory = allSubcategoriesList[Math.floor(Math.random() * allSubcategoriesList.length)];
    const questions = randomSubcategory.questions;
    
    if (questions.length === 0) {
      return {
        question: "What's one thing you're grateful for today?",
        category: randomSubcategory.name || "Daily Reflection",
        zone: randomSubcategory.zoneName || "Unknown Zone",
        subcategory: randomSubcategory.name || "Unknown"
      };
    }
    
    // Pick a random question from this subcategory
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    return {
      question: randomQuestion,
      category: randomSubcategory.name || "Daily Reflection",
      zone: randomSubcategory.zoneName || "Unknown Zone",
      subcategory: randomSubcategory.name || "Unknown",
      source: randomSubcategory.source || "Unknown"
    };
  } catch (error) {
    console.error('❌ Error getting random question from all data:', error);
    return {
      question: "What's one thing you're grateful for today?",
      category: "Daily Reflection",
      zone: "Unknown Zone",
      subcategory: "Unknown"
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

// Schedule daily reminder notification every 24 hours
export const scheduleDailyReminder = async () => {
  try {
    console.log('📅 Scheduling daily reminder for every 24 hours...');
    console.log('🔍 DEBUG: scheduleDailyReminder called');
    
    if (Platform.OS === 'web') {
      console.log('Daily reminders not supported on web');
      return null;
    }

    console.log('🔍 DEBUG: About to get next daily question...');
    // Get next sequential question for daily reminder
    const nextQuestionData = await getNextDailyQuestion();
    console.log('🔍 DEBUG: Got question data:', nextQuestionData.subcategory);
    
    // Cancel any existing daily reminders to avoid duplicates
    const existingId = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      console.log('Cancelled existing daily reminder:', existingId);
    }
    
    // Schedule for exactly 24 hours from now (more reliable than specific time)
    const triggerTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    console.log('🔍 DEBUG: About to schedule notification with 24-hour trigger...');
    console.log('⏰ Scheduled for:', triggerTime.toLocaleString());
    
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
        type: 'date',
        date: triggerTime,
        repeats: false, // Will be rescheduled after each trigger
      },
    });

    console.log('🔍 DEBUG: Notification scheduled with ID:', id);
    // Store the notification ID in separate key
    await AsyncStorage.setItem(DAILY_REMINDER_ID_KEY, id);
    console.log('✅ Daily reminder scheduled successfully (every 24 hours):', id);
    console.log('📋 Zone:', nextQuestionData.zone);
    console.log('📂 Subcategory:', nextQuestionData.subcategory);
    console.log('⏰ First notification will arrive in exactly 24 hours');
    
    return id;
  } catch (error) {
    console.error('❌ Error scheduling daily reminder:', error);
    return null;
  }
};

// Check the status of daily reminder
export const checkDailyReminderStatus = async () => {
  try {
    console.log('🔍 Checking daily reminder status...');
    
    const isEnabled = await AsyncStorage.getItem(DAILY_REMINDER_KEY);
    const existingId = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
    
    if (isEnabled !== 'true') {
      console.log('❌ Daily reminders are disabled');
      return { enabled: false, scheduled: false, nextTrigger: null };
    }
    
    if (!existingId) {
      console.log('⚠️ Daily reminders enabled but no notification ID found');
      return { enabled: true, scheduled: false, nextTrigger: null };
    }
    
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const dailyNotification = scheduledNotifications.find(notif => notif.identifier === existingId);
      
      if (dailyNotification) {
        const nextTrigger = dailyNotification.trigger;
        console.log('✅ Daily reminder is scheduled');
        console.log('⏰ Next trigger:', nextTrigger);
        return { 
          enabled: true, 
          scheduled: true, 
          nextTrigger: nextTrigger,
          notificationId: existingId
        };
      } else {
        console.log('⚠️ Daily reminder enabled but not currently scheduled');
        return { enabled: true, scheduled: false, nextTrigger: null };
      }
    } catch (error) {
      console.error('Error checking scheduled notifications:', error);
      return { enabled: true, scheduled: false, nextTrigger: null };
    }
  } catch (error) {
    console.error('❌ Error checking daily reminder status:', error);
    return { enabled: false, scheduled: false, nextTrigger: null };
  }
};

// Manually trigger the next daily reminder (for testing)
export const triggerNextDailyReminder = async () => {
  try {
    console.log('🚀 Manually triggering next daily reminder...');
    
    // Cancel existing reminder
    const existingId = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      console.log('Cancelled existing daily reminder:', existingId);
    }
    
    // Schedule for 10 seconds from now for testing
    const triggerTime = new Date(Date.now() + 10 * 1000);
    console.log('⏰ Test notification scheduled for:', triggerTime.toLocaleString());
    
    const nextQuestionData = await getNextDailyQuestion();
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌅 ${nextQuestionData.subcategory || 'Daily Question'}`,
        body: nextQuestionData.question,
        data: { 
          type: 'daily_question',
          category: 'Daily Reminder',
          zone: nextQuestionData.zone,
          subcategory: nextQuestionData.subcategory,
          screen: 'Notifications',
          test: true // Mark as test notification
        },
        sound: 'default',
        priority: 'high',
      },
      trigger: {
        type: 'date',
        date: triggerTime,
        repeats: false,
      },
    });

    console.log('✅ Test daily reminder scheduled:', id);
    return id;
  } catch (error) {
    console.error('❌ Error triggering test daily reminder:', error);
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

// Function to trigger new category alert when user adds new zone/category to home screen
export const triggerNewCategoryAlert = async (categoryName, categoryDescription, zoneName = null) => {
  try {
    console.log('🆕 Triggering new category alert for:', categoryName);
    
    // Check notification settings before proceeding
    const newCategoryAlertsEnabled = await AsyncStorage.getItem(NEW_CATEGORY_ALERT_KEY);
    
    console.log('🔔 New category alerts enabled:', newCategoryAlertsEnabled);
    
    if (newCategoryAlertsEnabled !== 'true') {
      console.log('🔕 New category alerts are disabled, NOT sending notification:', categoryName);
      return null; // Don't send notification or add to screen
    }
    
    if (Platform.OS === 'web') return null;
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🆕 New Category Available!',
        body: `${categoryName}: ${categoryDescription || 'Discover new ways to connect!'}`,
        data: { 
          type: 'new_category',
          category: 'General',
          categoryName: categoryName,
          zoneName: zoneName,
          screen: 'Notifications',
          userAction: 'home_screen_addition'
        },
        sound: 'default',
        priority: 'high',
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: null, // Send immediately
    });
    
    console.log('🆕 New category alert sent for home screen addition:', id);
    console.log('📂 Category:', categoryName);
    console.log('🏷️ Zone:', zoneName);
    
    return id;
  } catch (error) {
    console.error('Error sending new category alert for home screen addition:', error);
    return null;
  }
};

// Function to trigger custom zone creation notification
export const triggerCustomZoneAlert = async (zoneName, subcategoriesCount, questionsCount) => {
  try {
    console.log(' Triggering custom zone alert for:', zoneName);
    
    // Check notification settings before proceeding
    const newCategoryAlertsEnabled = await AsyncStorage.getItem(NEW_CATEGORY_ALERT_KEY);
    
    console.log('🔔 Custom zone - New category alerts enabled:', newCategoryAlertsEnabled);
    
    if (newCategoryAlertsEnabled !== 'true') {
      console.log('🔕 New category alerts are disabled, NOT sending custom zone notification:', zoneName);
      return null; // Don't send notification or add to screen
    }
    
    if (Platform.OS === 'web') return null;
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: ' Custom Zone Created!',
        body: `Your "${zoneName}" zone with ${subcategoriesCount} subcategories and ${questionsCount} questions is ready to explore!`,
        data: { 
          type: 'custom_zone_created',
          category: 'Custom Zones',
          zoneName: zoneName,
          subcategoriesCount: subcategoriesCount,
          questionsCount: questionsCount,
          screen: 'Notifications',
          userAction: 'custom_zone_creation'
        },
        sound: 'default',
        priority: 'high',
        // Add app logo
        icon: require('../../assets/logo.png'),
      },
      trigger: null, // Send immediately
    });
    
    console.log(' Custom zone alert sent:', id);
    console.log('📂 Zone:', zoneName);
    console.log('📊 Subcategories:', subcategoriesCount);
    console.log('❓ Questions:', questionsCount);
    
    return id;
  } catch (error) {
    console.error('Error sending custom zone alert:', error);
    return null;
  }
};

/*
USAGE EXAMPLE:
When user adds a new zone or category from the home screen, call this function:

import { triggerNewCategoryAlert } from '../../services/notificationService';

// When user adds a new zone:
await triggerNewCategoryAlert(
  'Mindfulness Zone',
  'Practice daily reflection and mindfulness exercises',
  'Mindfulness'
);

// When user adds a new category:
await triggerNewCategoryAlert(
  'Deep Questions',
  'Explore thought-provoking questions for deeper connections'
);
*/

// Function to send new category alert when a new category is actually added
export const sendNewCategoryAlert = async (categoryName, categoryDescription) => {
  try {
    console.log(' Sending new category alert for:', categoryName);
    
    // Check notification settings before proceeding
    const newCategoryAlertsEnabled = await AsyncStorage.getItem(NEW_CATEGORY_ALERT_KEY);
    
    console.log('🔔 Send new category - New category alerts enabled:', newCategoryAlertsEnabled);
    
    if (newCategoryAlertsEnabled !== 'true') {
      console.log('🔕 New category alerts are disabled, NOT sending notification:', categoryName);
      return null; // Don't send notification or add to screen
    }
    
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
    'general': 'General',
    'daily_question': 'Daily Questions',
    'new_category': 'New Categories',
    'custom_zone_created': 'Custom Zones',
    'custom zones': 'Custom Zones',
    'reengage': 'Reminders'
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
  console.log('📱 Notification received:', notification.request.content.title);
  
  // Check if this is a daily question notification and reschedule appropriately
  const notificationType = notification.request.content.data?.type;
  const isTest = notification.request.content.data?.test;
  const isRandom = notification.request.content.data?.random;
  
  if (notificationType === 'daily_question') {
    if (isRandom) {
      console.log('🎲 Random daily question notification received, scheduling another random question for 24 hours...');
      
      // Don't reschedule if it's a test notification
      if (!isTest) {
        // Add a small delay to prevent immediate rescheduling loop
        setTimeout(() => {
          sendDailyRandomQuestionNotification().catch(error => {
            console.error('❌ Error rescheduling random daily question:', error);
          });
        }, 2000); // 2 second delay to ensure proper processing
      } else {
        console.log('🧪 Test random notification received, not rescheduling');
      }
    } else {
      console.log('🔄 Sequential daily question notification received, rescheduling for next 24 hours...');
      
      // Don't reschedule if it's a test notification
      if (!isTest) {
        // Add a small delay to prevent immediate rescheduling loop
        setTimeout(() => {
          scheduleDailyReminder().catch(error => {
            console.error('❌ Error rescheduling daily reminder:', error);
          });
        }, 2000); // 2 second delay to ensure proper processing
      } else {
        console.log('🧪 Test sequential notification received, not rescheduling');
      }
    }
  }
  
  // Don't automatically add custom zone or new category notifications to the notification screen
  // These are already handled by the system notifications
  if (notificationType === 'custom_zone_created' || notificationType === 'new_category') {
    console.log('🔕 Skipping automatic notification screen addition for:', notificationType);
    return;
  }
  
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
  console.log('📱 Notification tapped:', response.notification.request.content.title);
  console.log('🧭 Navigating to notification screen...');
  
  // Extract navigation data from notification
  const notificationData = response.notification.request.content.data || {};
  const targetScreen = notificationData.screen || 'Notifications';
  const notificationId = notificationData.id;
  const isTest = notificationData.test;
  
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
  
  // Check if this is a daily question notification and reschedule appropriately
  if (notificationData.type === 'daily_question') {
    const isRandom = notificationData.random;
    
    if (isRandom) {
      console.log('🎲 Random daily question notification triggered, scheduling another random question for 24 hours...');
      
      // Don't reschedule if it's a test notification
      if (!isTest) {
        // Add a small delay to prevent immediate rescheduling loop
        setTimeout(() => {
          sendDailyRandomQuestionNotification().catch(error => {
            console.error('❌ Error rescheduling random daily question:', error);
          });
        }, 2000); // 2 second delay to ensure proper processing
      } else {
        console.log('🧪 Test random notification tapped, not rescheduling');
      }
    } else {
      console.log('🔄 Sequential daily question notification triggered, rescheduling for next 24 hours...');
      
      // Don't reschedule if it's a test notification
      if (!isTest) {
        // Add a small delay to prevent immediate rescheduling loop
        setTimeout(() => {
          scheduleDailyReminder().catch(error => {
            console.error('❌ Error rescheduling daily reminder:', error);
          });
        }, 2000); // 2 second delay to ensure proper processing
      } else {
        console.log('🧪 Test sequential notification tapped, not rescheduling');
      }
    }
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
      // Return without sending immediate notification
      return null;
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
    // Return without sending immediate notification
    return null;
  }
};


// Send real Firebase push notification for new category alerts
export const sendNewCategoryPushNotification = async () => {
  try {
    // Get the Expo push token
    const token = await getFCMToken();
    
    if (!token || token.startsWith('mock-token')) {
      console.log('Using local notification - Firebase not configured');
      // Return without sending immediate notification
      return null;
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
    // Return without sending immediate notification
    return null;
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

// Debug function to check all scheduled notifications
export const debugScheduledNotifications = async () => {
  try {
    console.log('🔍 DEBUG: Checking all scheduled notifications...');
    
    if (Platform.OS === 'web') {
      console.log('Scheduled notifications not supported on web');
      return [];
    }
    
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📊 Total scheduled notifications: ${scheduledNotifications.length}`);
    
    scheduledNotifications.forEach((notification, index) => {
      console.log(`🔔 Notification ${index + 1}:`);
      console.log(`  ID: ${notification.identifier}`);
      console.log(`  Title: ${notification.content.title}`);
      console.log(`  Body: ${notification.content.body}`);
      console.log(`  Type: ${notification.content.data?.type}`);
      console.log(`  Random: ${notification.content.data?.random}`);
      console.log(`  Trigger:`, notification.trigger);
      if (notification.trigger?.type === 'date' && notification.trigger?.date) {
        console.log(`  Scheduled for: ${new Date(notification.trigger.date).toLocaleString()}`);
        console.log(`  Time remaining: ${Math.floor((new Date(notification.trigger.date).getTime() - Date.now()) / (1000 * 60 * 60))} hours`);
      }
    });
    
    // Check storage keys
    const dailyReminderId = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
    const dailyReminderEnabled = await AsyncStorage.getItem(DAILY_REMINDER_KEY);
    
    console.log('📱 Storage status:');
    console.log(`  Daily reminder enabled: ${dailyReminderEnabled}`);
    console.log(`  Daily reminder ID: ${dailyReminderId}`);
    
    return scheduledNotifications;
  } catch (error) {
    console.error('❌ Error debugging scheduled notifications:', error);
    return [];
  }
};

// Test function to send random question notification after 10 seconds (for debugging)
export const testRandomQuestionNotification = async () => {
  try {
    console.log('🧪 Testing random question notification (10 seconds)...');
    
    if (Platform.OS === 'web') {
      console.log('Scheduled notifications not supported on web');
      return null;
    }
    
    // Get random question from all 600 questions
    const randomQuestionData = getRandomQuestionFromAllData();
    
    console.log('🧪 Test - Selected random question from:', randomQuestionData.source);
    console.log('🧪 Test - Zone:', randomQuestionData.zone);
    console.log('🧪 Test - Subcategory:', randomQuestionData.subcategory);
    console.log('🧪 Test - Question:', randomQuestionData.question);
    
    // Schedule notification for 10 seconds from now
    const triggerTime = new Date(Date.now() + 10 * 1000);
    console.log('🧪 Test notification scheduled for:', triggerTime.toLocaleString());
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🧪 TEST: ${randomQuestionData.subcategory || 'Random Question'}`,
        body: randomQuestionData.question,
        data: { 
          type: 'daily_question',
          category: 'Daily Reminder',
          zone: randomQuestionData.zone,
          subcategory: randomQuestionData.subcategory,
          screen: 'Notifications',
          test: true,
          random: true // Mark as random question
        },
        sound: 'default',
        priority: 'high',
      },
      trigger: {
        type: 'date',
        date: triggerTime,
        repeats: false,
      },
    });

    console.log('🧪 Test random question notification scheduled with ID:', id);
    console.log('🧪 Will arrive in 10 seconds');
    
    return id;
  } catch (error) {
    console.error('❌ Error testing random question notification:', error);
    return null;
  }
};

// Send immediate random question notification after 1 hour (when enabling daily reminders)
export const sendImmediateRandomQuestionNotification = async () => {
  try {
    console.log('🎲 Sending immediate random question notification after 1 hour...');
    
    if (Platform.OS === 'web') {
      console.log('Immediate notifications not supported on web');
      return null;
    }
    
    // Get random question from all 600 questions
    const randomQuestionData = getRandomQuestionFromAllData();
    
    console.log('🎲 Selected random question from:', randomQuestionData.source);
    console.log('🏷️ Zone:', randomQuestionData.zone);
    console.log('📂 Subcategory:', randomQuestionData.subcategory);
    console.log('❓ Question:', randomQuestionData.question);
    
    // Schedule notification for 1 hour from now (3600 seconds)
    const triggerTime = new Date(Date.now() + 60 * 60 * 1000);
    console.log('⏰ Immediate random question notification scheduled for:', triggerTime.toLocaleString());
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${randomQuestionData.subcategory || 'Random Question'}`,
        body: randomQuestionData.question,
        data: { 
          type: 'daily_question',
          category: 'Daily Reminder',
          zone: randomQuestionData.zone,
          subcategory: randomQuestionData.subcategory,
          screen: 'Notifications',
          immediate: true,
          random: true // Mark as random question
        },
        sound: 'default',
        priority: 'high',
      },
      trigger: {
        type: 'date',
        date: triggerTime,
        repeats: false,
      },
    });

    console.log('✅ Immediate random question notification scheduled with ID:', id);
    console.log('🎲 Will arrive in 1 hour with a random question from 600 total questions');
    console.log('📱 Works whether app is closed or opened');
    
    return id;
  } catch (error) {
    console.error('❌ Error sending immediate random question notification:', error);
    return null;
  }
};

// Send notification with random question after 24 hours (works whether app is closed or opened)
export const sendDailyRandomQuestionNotification = async () => {
  try {
    console.log('📅 Sending random question notification after 24 hours...');
    console.log('📱 Works whether app is closed or opened');
    
    if (Platform.OS === 'web') {
      console.log('Scheduled notifications not supported on web');
      return null;
    }
    
    // Get random question from all 600 questions
    const randomQuestionData = getRandomQuestionFromAllData();
    
    console.log('🎲 Selected random question from:', randomQuestionData.source);
    console.log('🏷️ Zone:', randomQuestionData.zone);
    console.log('📂 Subcategory:', randomQuestionData.subcategory);
    console.log('❓ Question:', randomQuestionData.question);
    
    // Schedule notification for 24 hours from now
    const triggerTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    console.log('⏰ Random question notification scheduled for:', triggerTime.toLocaleString());
    
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${randomQuestionData.subcategory || 'Random Question'}`,
        body: randomQuestionData.question,
        data: { 
          type: 'daily_question',
          category: 'Daily Reminder',
          zone: randomQuestionData.zone,
          subcategory: randomQuestionData.subcategory,
          screen: 'Notifications',
          scheduled: true,
          random: true // Mark as random question
        },
        sound: 'default',
        priority: 'high',
      },
      trigger: {
        type: 'date',
        date: triggerTime,
        repeats: false,
      },
    });

    console.log('✅ Random question notification scheduled with ID:', id);
    console.log('🎲 Will arrive in 24 hours with a random question from 600 total questions');
    console.log('📱 Works whether app is closed or opened');
    
    return id;
  } catch (error) {
    console.error('❌ Error scheduling 24-hour random question notification:', error);
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


// Restore new category alerts on app start (persists across app kills/restarts)
export const restoreNewCategoryAlerts = async () => {
  try {
    console.log('🔄 Restoring new category alerts on app start...');
    
    // Check if new category alerts were previously enabled
    const newCategoryAlertsEnabled = await AsyncStorage.getItem(NEW_CATEGORY_ALERT_KEY);
    
    if (newCategoryAlertsEnabled === 'true') {
      console.log('✅ New category alerts were enabled, checking existing schedule...');
      
      // Check if there's an existing scheduled notification
      const existingId = await AsyncStorage.getItem('NEW_CATEGORY_ALERTS_ID');
      
      if (existingId) {
        try {
          // Check if the notification is still scheduled
          const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
          const isStillScheduled = scheduledNotifications.some(notif => notif.identifier === existingId);
          
          if (isStillScheduled) {
            console.log('✅ New category alerts are still active and scheduled');
            return existingId;
          } else {
            console.log('⚠️ New category alerts were enabled but not scheduled, rescheduling...');
          }
        } catch (error) {
          console.log('⚠️ Could not check scheduled notifications, rescheduling...');
        }
      }
      
      // Schedule new category alerts if needed
      const newId = await scheduleNewCategoryAlert();
      if (newId) {
        console.log('✅ New category alerts restored and scheduled successfully');
        return newId;
      } else {
        console.log('❌ Failed to restore new category alerts');
        return null;
      }
    } else {
      console.log('ℹ️ New category alerts were not enabled');
      return null;
    }
  } catch (error) {
    console.error('❌ Error restoring new category alerts:', error);
    return null;
  }
};

// Restore daily reminder on app start (persists across app kills/restarts)
export const restoreDailyReminder = async () => {
  try {
    console.log('🔄 Restoring daily reminder on app start...');
    
    // Check if daily reminder was previously enabled
    const dailyReminderEnabled = await AsyncStorage.getItem(DAILY_REMINDER_KEY);
    
    if (dailyReminderEnabled === 'true') {
      console.log('✅ Daily reminder was enabled, checking existing schedule...');
      
      // Check if there's an existing scheduled notification ID
      const existingId = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
      
      if (existingId) {
        try {
          // Check if the notification is still scheduled
          const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
          const isStillScheduled = scheduledNotifications.some(notif => notif.identifier === existingId);
          
          if (isStillScheduled) {
            console.log('✅ Daily reminder is still active and scheduled');
            return existingId;
          } else {
            console.log('⚠️ Daily reminder was enabled but not scheduled, rescheduling...');
          }
        } catch (error) {
          console.log('⚠️ Could not check scheduled notifications, rescheduling...');
        }
      }
      
      // Schedule new daily reminder if needed
      const newId = await scheduleDailyReminder();
      if (newId) {
        console.log('✅ Daily reminder restored and scheduled successfully');
        return newId;
      } else {
        console.log('❌ Failed to restore daily reminder');
        return null;
      }
    } else {
      console.log('ℹ️ Daily reminder was not enabled');
      return null;
    }
  } catch (error) {
    console.error('❌ Error restoring daily reminder:', error);
    return null;
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
    const { dailyReminders, newCategoryAlerts } = preferences;

    // Subscribe/unsubscribe from Firebase topics based on preferences
    if (dailyReminders) {
      await subscribeToTopic('daily_reminders');
    } else {
      await unsubscribeFromTopic('daily_reminders');
    }

    if (newCategoryAlerts) {
      await subscribeToTopic('new_category_alerts');
    } else {
      await unsubscribeFromTopic('new_category_alerts');
    }

    // Save preferences locally
    await AsyncStorage.setItem(DAILY_REMINDER_KEY, dailyReminders.toString());
    await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, newCategoryAlerts.toString());

    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
};

// Clean up all daily question notifications (when disabling daily reminders)
export const cleanupDailyQuestionNotifications = async () => {
  try {
    console.log('🧹 Cleaning up all daily question notifications...');
    
    if (Platform.OS === 'web') {
      console.log('Notification cleanup not supported on web');
      return true;
    }
    
    // Get all scheduled notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📊 Found ${scheduledNotifications.length} scheduled notifications`);
    
    let cancelledCount = 0;
    
    // Cancel all daily question notifications
    for (const notification of scheduledNotifications) {
      const notificationType = notification.content.data?.type;
      const isRandom = notification.content.data?.random;
      
      // Cancel if it's a daily question notification (both random and sequential)
      if (notificationType === 'daily_question') {
        console.log(`🗑️ Cancelling daily question notification: ${notification.content.title}`);
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        cancelledCount++;
      }
    }
    
    // Also clear the stored daily reminder ID
    const dailyReminderId = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
    if (dailyReminderId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(dailyReminderId);
        console.log(`🗑️ Cancelled stored daily reminder ID: ${dailyReminderId}`);
      } catch (error) {
        console.log('⚠️ Stored daily reminder ID was already cancelled or invalid');
      }
      await AsyncStorage.removeItem(DAILY_REMINDER_ID_KEY);
    }
    
    console.log(`✅ Cleaned up ${cancelledCount} daily question notifications`);
    return true;
    
  } catch (error) {
    console.error('❌ Error cleaning up daily question notifications:', error);
    return false;
  }
};

// Emergency cleanup function to cancel all notifications (for troubleshooting)
export const emergencyCleanupAllNotifications = async () => {
  try {
    console.log('🚨 Emergency cleanup: cancelling ALL scheduled notifications...');
    
    if (Platform.OS === 'web') {
      console.log('Notification cleanup not supported on web');
      return true;
    }
    
    // Get all scheduled notifications
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📊 Found ${scheduledNotifications.length} scheduled notifications to cancel`);
    
    let cancelledCount = 0;
    
    // Cancel ALL notifications
    for (const notification of scheduledNotifications) {
      console.log(`🗑️ Cancelling notification: ${notification.content.title}`);
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      cancelledCount++;
    }
    
    // Clear all stored notification IDs
    await AsyncStorage.removeItem(DAILY_REMINDER_ID_KEY);
    await AsyncStorage.removeItem(REENGAGE_ID_KEY);
    
    console.log(`✅ Emergency cleanup completed: cancelled ${cancelledCount} notifications`);
    return true;
    
  } catch (error) {
    console.error('❌ Error during emergency cleanup:', error);
    return false;
  }
};

// Enhanced Firebase notification handlers with immediate + 24-hour notifications
export const enableDailyRemindersWithFirebase = async () => {
  try {
    console.log('🌅 Enabling daily reminders with real Firebase...');
    console.log('🔍 DEBUG: About to get permissions...');
    
    // Request permissions
    const hasPermission = await requestFirebasePermission();
    console.log('🔍 DEBUG: Firebase permission result:', hasPermission);
    
    if (!hasPermission) {
      // Permission denied - no alert, just return false
      console.log('🔍 DEBUG: Permission denied, returning false');
      return false;
    }
    
    console.log('🔍 DEBUG: About to get Expo push token...');
    // Get real Expo push token
    const token = await getFCMToken();
    console.log('🔍 DEBUG: Token result:', token ? 'exists' : 'null');
    
    if (!token) {
      console.log('⚠️ No Expo push token available, using local notifications only');
      console.log('🔍 DEBUG: About to schedule daily reminder (local path)...');
      await scheduleDailyReminder();
      await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'true');
      console.log('🔍 DEBUG: Local reminder scheduled, preference saved');
      
      // Send immediate random question notification after 1 hour
      console.log('🎲 Sending immediate random question notification (1 hour)...');
      await sendImmediateRandomQuestionNotification();
      
      // Schedule 24-hour random question notification for subsequent days
      console.log('📅 Scheduling 24-hour random question notification...');
      await sendDailyRandomQuestionNotification();
      
      // No alert - just enable silently
      return true;
    }
    
    console.log('🔍 DEBUG: About to subscribe to Firebase topic...');
    // Subscribe to Firebase topic (stored locally for backend handling)
    // TEMPORARILY DISABLED TO TEST IF BACKEND IS SENDING IMMEDIATE NOTIFICATIONS
    // await subscribeToTopic('daily_reminders');
    console.log('🔕 Firebase subscription temporarily disabled for testing');
    
    console.log('🔍 DEBUG: About to save preference...');
    // Save preference
    await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'true');
    console.log('🔍 DEBUG: Preference saved');
    
    console.log('🔍 DEBUG: About to schedule local notification as backup...');
    // Schedule local notification as backup
    await scheduleDailyReminder();
    console.log('🔍 DEBUG: Local backup notification scheduled');
    
    // Send immediate random question notification after 2 seconds
    console.log('🎲 Sending immediate random question notification (2 seconds)...');
    await sendImmediateRandomQuestionNotification();
    
    // Schedule 24-hour random question notification for subsequent days
    console.log('📅 Scheduling 24-hour random question notification...');
    await sendDailyRandomQuestionNotification();
    
    // No alert - just enable silently
    console.log('🔍 DEBUG: Daily reminders enabled successfully, returning true');
    return true;
  } catch (error) {
    console.error('❌ Error enabling daily reminders:', error);
    console.log('🔍 DEBUG: Entering fallback path...');
    // Fallback to local only
    try {
      console.log('🔍 DEBUG: About to schedule daily reminder (fallback)...');
      await scheduleDailyReminder();
      await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'true');
      console.log('🔍 DEBUG: Fallback reminder scheduled, preference saved');
      
      // Send immediate random question notification after 2 seconds
      console.log('🎲 Sending immediate random question notification in fallback (2 seconds)...');
      await sendImmediateRandomQuestionNotification();
      
      // Schedule 24-hour random question notification for subsequent days
      console.log('📅 Scheduling 24-hour random question notification in fallback...');
      await sendDailyRandomQuestionNotification();
      
      // No alert - just enable silently
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      console.log('🔍 DEBUG: Fallback failed, returning false');
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
      console.log('❌ Permission denied for new category alerts');
      return false;
    }
    
    // Get real Expo push token
    const token = await getFCMToken();
    if (!token) {
      console.log('⚠️ No Expo push token available, using local notifications only');
      await scheduleNewCategoryAlert();
      await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, 'true');
      console.log('✅ New category alerts enabled locally (no token)');
      // No alert - just enable silently
      return true;
    }
    
    // Subscribe to Firebase topic (stored locally for backend handling)
    await subscribeToTopic('new_category_alerts');
    
    // Save preference
    await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, 'true');
    console.log('✅ New category alerts preference saved to AsyncStorage');
    
    // Schedule local notification as backup
    await scheduleNewCategoryAlert();
    
    // No alert - just enable silently
    console.log('✅ New category alerts enabled with Firebase');
    return true;
  } catch (error) {
    console.error('Error enabling new category alerts:', error);
    // Fallback to local only
    try {
      console.log('🔄 Attempting fallback to local notifications...');
      await scheduleNewCategoryAlert();
      await AsyncStorage.setItem(NEW_CATEGORY_ALERT_KEY, 'true');
      console.log('✅ New category alerts enabled (fallback mode)');
      // No alert - just enable silently
      return true;
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      // No alert - just return false
      return false;
    }
  }
};
