import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { allCategories } from '../data/decks';
import { 
  NOTIF_ENABLED_KEY, 
  REENGAGE_ID_KEY,
  DAILY_REMINDER_KEY,
  WEEKLY_HIGHLIGHTS_KEY,
  NEW_CATEGORY_ALERT_KEY
} from '../constants/storageKeys';

// Notifications handler: show alerts, no sound/badge by default
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const pickSuggestionBody = () => {
  try {
    if (Array.isArray(allCategories) && allCategories.length > 0) {
      const c = allCategories[Math.floor(Math.random() * allCategories.length)];
      const name = c?.name || 'a category';
      return `Take a moment today — try a card from ${name}.`;
    }
  } catch {}
  return 'Take a mindful minute — open Unflod Cards today.';
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
      },
      trigger: { hour: 19, minute: 0, repeats: true },
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
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly Highlights',
        body: 'Catch up on your favorite moments from this week. Tap to explore!',
        data: { type: 'weekly_highlights' },
      },
      trigger: { weekday: 1, hour: 10, minute: 0, repeats: true }, // Monday at 10 AM
    });
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
      },
      trigger: { hour: 12, minute: 0, repeats: false }, // One-time notification at noon
    });
    return id;
  } catch {}
  return null;
};

export const scheduleDailyQuestionReminder = async () => {
  try {
    if (Platform.OS === 'web') return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Question',
        body: 'Your daily question is ready! Take a moment to reflect and connect.',
        data: { type: 'daily_question' },
      },
      trigger: { hour: 9, minute: 0, repeats: true }, // Daily at 9 AM
    });
    return id;
  } catch {}
  return null;
};
