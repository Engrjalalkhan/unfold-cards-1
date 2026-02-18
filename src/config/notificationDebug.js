// Debug and test Firebase push notifications
// Run this function to test your notification setup

import { getFCMToken } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export const debugNotifications = async () => {
  console.log('🔍 === NOTIFICATION DEBUG START ===');
  
  try {
    // 1. Check permissions
    console.log('1️⃣ Checking notification permissions...');
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Permission status:', status);
    
    if (status !== 'granted') {
      console.log('❌ Permissions not granted. Requesting...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      console.log('New permission status:', newStatus);
      
      if (newStatus !== 'granted') {
        console.log('❌ Permission denied. Enable in device settings.');
        return false;
      }
    }
    
    // 2. Get FCM token
    console.log('2️⃣ Getting FCM token...');
    const token = await getFCMToken();
    console.log('FCM Token:', token);
    
    if (!token) {
      console.log('❌ No FCM token obtained');
      return false;
    }
    
    // 3. Check stored token
    console.log('3️⃣ Checking stored token...');
    const storedToken = await AsyncStorage.getItem('FCM_TOKEN_KEY');
    console.log('Stored token:', storedToken);
    
    // 4. Test local notification
    console.log('4️⃣ Testing local notification...');
    const testId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Notification',
        body: 'This is a test local notification',
        data: { type: 'test', local: true },
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
    console.log('Local notification sent with ID:', testId);
    
    // 5. Check notification settings
    console.log('5️⃣ Checking notification settings...');
    const notificationSettings = await Notifications.getNotificationChannelsAsync();
    console.log('Notification channels:', notificationSettings);
    
    console.log('✅ === NOTIFICATION DEBUG COMPLETE ===');
    console.log('📋 Your FCM Token for Firebase Console:');
    console.log(token);
    console.log('🔗 Use this token in Firebase Console → Messaging → Test on device');
    
    return {
      permissions: status,
      token,
      storedToken,
      localNotificationId: testId
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    return false;
  }
};

// Test Firebase notification via console
export const testFirebaseNotification = async () => {
  console.log('🔥 Testing Firebase notification...');
  
  const token = await getFCMToken();
  if (!token) {
    console.log('❌ No token available for Firebase test');
    return false;
  }
  
  // This would be called from your Firebase Console test
  console.log('📱 Ready for Firebase test with token:', token);
  console.log('🌐 Go to Firebase Console → Messaging → Test on device');
  console.log('📝 Paste this token and send test message');
  
  return token;
};

export default {
  debugNotifications,
  testFirebaseNotification
};
