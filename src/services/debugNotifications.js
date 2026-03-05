// Debug and Test Notification Functions
// Import this file and call these functions to debug notification issues

import * as Notifications from 'expo-notifications';
import { 
  debugScheduledNotifications, 
  testRandomQuestionNotification,
  sendDailyRandomQuestionNotification,
  sendImmediateRandomQuestionNotification,
  checkDailyReminderStatus
} from './notificationService';

// Function to run all debug tests
export const runNotificationDebug = async () => {
  console.log('🚀 Starting notification debug tests...');
  
  try {
    // 1. Check daily reminder status
    console.log('\n📋 1. Checking daily reminder status...');
    const status = await checkDailyReminderStatus();
    console.log('Status:', status);
    
    // 2. Check all scheduled notifications
    console.log('\n📋 2. Checking scheduled notifications...');
    await debugScheduledNotifications();
    
    // 3. Test immediate notification (10 seconds)
    console.log('\n📋 3. Testing immediate notification (10 seconds)...');
    const testId = await testRandomQuestionNotification();
    console.log('Test notification ID:', testId);
    
    // 4. Schedule actual 24-hour notification
    console.log('\n📋 4. Scheduling 24-hour random question notification...');
    const dailyId = await sendDailyRandomQuestionNotification();
    console.log('Daily notification ID:', dailyId);
    
    console.log('\n✅ Debug tests completed!');
    console.log('📱 You should receive a test notification in 10 seconds');
    console.log('📱 The actual 24-hour notification is scheduled');
    
    return {
      status,
      testNotificationId: testId,
      dailyNotificationId: dailyId
    };
    
  } catch (error) {
    console.error('❌ Error running debug tests:', error);
    return null;
  }
};

// Function to check notification permissions
export const checkNotificationPermissions = async () => {
  try {
    console.log('🔍 Checking notification permissions...');
    
    const { status } = await Notifications.getPermissionsAsync();
    console.log('Current permission status:', status);
    
    if (status !== 'granted') {
      console.log('❌ Notifications not granted, requesting permissions...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      console.log('New permission status:', newStatus);
      return newStatus === 'granted';
    }
    
    console.log('✅ Notifications already granted');
    return true;
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
    return false;
  }
};

// Quick test function - just the 10 second test
export const quickTest = async () => {
  console.log('🧪 Quick test - scheduling notification for 10 seconds...');
  const testId = await testRandomQuestionNotification();
  console.log('Test notification scheduled with ID:', testId);
  console.log('📱 You should receive it in 10 seconds');
  return testId;
};

// Test immediate 1-hour notification (like when enabling daily reminders)
export const testImmediateNotification = async () => {
  console.log('⚡ Test - scheduling immediate notification for 1 hour...');
  const immediateId = await sendImmediateRandomQuestionNotification();
  console.log('Immediate notification scheduled with ID:', immediateId);
  console.log('📱 You should receive it in 1 hour');
  return immediateId;
};

// Test the complete flow: immediate (1hour) + 24-hour
export const testCompleteFlow = async () => {
  console.log('🔄 Testing complete flow: immediate (1hour) + 24-hour...');
  
  try {
    // 1. Send immediate notification
    console.log('\n⚡ 1. Sending immediate notification (1 hour)...');
    const immediateId = await sendImmediateRandomQuestionNotification();
    console.log('Immediate notification ID:', immediateId);
    
    // 2. Schedule 24-hour notification
    console.log('\n📅 2. Scheduling 24-hour notification...');
    const dailyId = await sendDailyRandomQuestionNotification();
    console.log('24-hour notification ID:', dailyId);
    
    console.log('\n✅ Complete flow test initiated!');
    console.log('📱 You will receive: 1 notification in 1 hour, then 1 notification in 24 hours');
    console.log('📱 Both notifications work whether app is closed or opened');
    console.log('📱 Notification titles will show subcategory name without emoji icons');
    
    return {
      immediateNotificationId: immediateId,
      dailyNotificationId: dailyId
    };
    
  } catch (error) {
    console.error('❌ Error testing complete flow:', error);
    return null;
  }
};
