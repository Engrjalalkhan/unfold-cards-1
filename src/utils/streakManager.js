import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDateKey } from './helpers';

export class StreakManager {
  static STREAK_KEY = 'userStreak';
  static LAST_SUBMISSION_KEY = 'lastSubmissionDate';

  // Get current streak data
  static async getStreakData() {
    try {
      const streakData = await AsyncStorage.getItem(this.STREAK_KEY);
      const lastSubmission = await AsyncStorage.getItem(this.LAST_SUBMISSION_KEY);
      
      return {
        streakDays: streakData ? parseInt(streakData) : 0,
        lastSubmissionDate: lastSubmission || null
      };
    } catch (error) {
      console.error('Error getting streak data:', error);
      return { streakDays: 0, lastSubmissionDate: null };
    }
  }

  // Update streak when user submits any question
  static async updateStreak() {
    try {
      const today = getDateKey();
      const { streakDays, lastSubmissionDate } = await this.getStreakData();

      let newStreak = streakDays;
      
      if (lastSubmissionDate === today) {
        // Already submitted today, don't increment
        console.log('Already submitted today, streak remains:', newStreak);
      } else if (lastSubmissionDate === this.getYesterdayKey()) {
        // Submitted yesterday, increment streak
        newStreak = streakDays + 1;
        console.log('Submitted yesterday, incrementing streak to:', newStreak);
      } else {
        // Missed days or first time, start new streak
        newStreak = 1;
        console.log('New streak starting at:', newStreak);
      }

      // Save new streak data
      await AsyncStorage.setItem(this.STREAK_KEY, newStreak.toString());
      await AsyncStorage.setItem(this.LAST_SUBMISSION_KEY, today);

      console.log('Streak updated:', { streakDays: newStreak, lastSubmissionDate: today });
      return newStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return streakDays;
    }
  }

  // Get yesterday's date key
  static getYesterdayKey() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  // Check if user has submitted today
  static async hasSubmittedToday() {
    try {
      const lastSubmission = await AsyncStorage.getItem(this.LAST_SUBMISSION_KEY);
      const today = getDateKey();
      return lastSubmission === today;
    } catch (error) {
      console.error('Error checking submission status:', error);
      return false;
    }
  }

  // Reset streak (for testing or if needed)
  static async resetStreak() {
    try {
      await AsyncStorage.removeItem(this.STREAK_KEY);
      await AsyncStorage.removeItem(this.LAST_SUBMISSION_KEY);
      console.log('Streak reset');
    } catch (error) {
      console.error('Error resetting streak:', error);
    }
  }
}
