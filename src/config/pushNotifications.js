// Firebase Push Notification Initialization
// Call this function from your App.js to initialize real push notifications

import { initializeFirebaseMessaging } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize Firebase push notifications when app starts
export const initializePushNotifications = async (navigationRef = null) => {
  try {
    console.log('🚀 Initializing Firebase Push Notifications...');
    
    // Check if notifications were previously enabled
    const notificationsEnabled = await AsyncStorage.getItem('NOTIF_ENABLED_KEY');
    
    if (notificationsEnabled === 'true') {
      console.log('📱 Notifications were enabled, initializing Firebase Messaging...');
      
      // Initialize Firebase Messaging
      const cleanup = await initializeFirebaseMessaging();
      
      if (cleanup) {
        console.log('✅ Firebase Push Notifications initialized successfully');
        
        // Store cleanup function for app unmount
        if (typeof global !== 'undefined') {
          global.firebaseCleanup = cleanup;
        }
        
        return true;
      } else {
        console.log('⚠️ Firebase Push Notifications initialization failed');
        return false;
      }
    } else {
      console.log('📵 Notifications are disabled, skipping Firebase initialization');
      return false;
    }
  } catch (error) {
    console.error('❌ Error initializing push notifications:', error);
    return false;
  }
};

// Cleanup Firebase resources when app unmounts
export const cleanupPushNotifications = () => {
  try {
    if (typeof global !== 'undefined' && global.firebaseCleanup) {
      console.log('🧹 Cleaning up Firebase Push Notifications...');
      global.firebaseCleanup();
      global.firebaseCleanup = null;
    }
  } catch (error) {
    console.error('❌ Error cleaning up push notifications:', error);
  }
};

// Test function to send immediate push notification
export const testPushNotification = async () => {
  try {
    console.log('🧪 Testing Firebase Push Notification...');
    
    // Import the send function
    const { sendFirebasePushNotification } = await import('../services/notificationService');
    
    const result = await sendFirebasePushNotification();
    
    if (result) {
      console.log('✅ Test push notification sent successfully');
      return true;
    } else {
      console.log('⚠️ Test push notification failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing push notification:', error);
    return false;
  }
};

export default {
  initializePushNotifications,
  cleanupPushNotifications,
  testPushNotification
};
