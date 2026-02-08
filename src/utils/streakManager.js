import AsyncStorage from '@react-native-async-storage/async-storage';

export class StreakManager {
  static STREAK_KEY = 'userStreak';
  static LAST_SUBMISSION_KEY = 'lastSubmissionTime';
  static LAST_SHARE_DATE_KEY = 'lastShareDate';

  // Get current streak data
  static async getStreakData() {
    try {
      const streakData = await AsyncStorage.getItem(this.STREAK_KEY);
      const lastSubmissionTime = await AsyncStorage.getItem(this.LAST_SUBMISSION_KEY);
      
      return {
        streakDays: streakData ? parseInt(streakData) : 0,
        lastSubmissionTime: lastSubmissionTime ? parseInt(lastSubmissionTime) : null
      };
    } catch (error) {
      console.error('Error getting streak data:', error);
      return { streakDays: 0, lastSubmissionTime: null };
    }
  }

  // Check if user has already shared today
  static async hasSharedToday() {
    try {
      const lastShareDate = await AsyncStorage.getItem(this.LAST_SHARE_DATE_KEY);
      if (!lastShareDate) return false;
      
      const today = new Date().toDateString();
      return lastShareDate === today;
    } catch (error) {
      console.error('Error checking if shared today:', error);
      return false;
    }
  }

  // Update streak when user SHARES a question (not when submitting answers)
  // IMPORTANT: This should only be called when sharing questions, not when submitting answers
  static async updateStreak() {
    try {
      const currentTime = Date.now();
      const { streakDays } = await this.getStreakData();
      const lastShareDate = await AsyncStorage.getItem(this.LAST_SHARE_DATE_KEY);
      const hasSharedToday = await this.hasSharedToday();

      let newStreak = streakDays;

      if (lastShareDate) {
        const lastShareDateTime = new Date(lastShareDate).getTime();
        const hoursSinceLastShare = (currentTime - lastShareDateTime) / (1000 * 60 * 60);

        // If more than 24 hours passed since last share, reset streak to 0
        if (hoursSinceLastShare >= 24) {
          await this.resetStreak();
          console.log('More than 24 hours since last share, streak reset to 0');
          return 0;
        }
      }

      // If sharing within 24 hours and haven't shared today, increment streak
      if (!hasSharedToday) {
        newStreak = streakDays + 1;
        await AsyncStorage.setItem(this.STREAK_KEY, newStreak.toString());
        await AsyncStorage.setItem(this.LAST_SHARE_DATE_KEY, new Date().toDateString());
        console.log('Shared within 24 hours, streak updated to:', newStreak);
      } else {
        console.log('Already shared today, streak not updated');
      }

      return newStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return streakDays;
    }
  }

  // Check if user has submitted in the last 24 hours
  static async hasSubmittedInLast24Hours() {
    try {
      const lastSubmissionTime = await AsyncStorage.getItem(this.LAST_SUBMISSION_KEY);
      if (!lastSubmissionTime) return false;
      
      const currentTime = Date.now();
      const hoursSinceLastSubmission = (currentTime - parseInt(lastSubmissionTime)) / (1000 * 60 * 60);
      
      return hoursSinceLastSubmission < 24;
    } catch (error) {
      console.error('Error checking 24-hour submission status:', error);
      return false;
    }
  }

  // Get hours until streak expires
  static async getHoursUntilStreakExpires() {
    try {
      const lastSubmissionTime = await AsyncStorage.getItem(this.LAST_SUBMISSION_KEY);
      if (!lastSubmissionTime) return 0;
      
      const currentTime = Date.now();
      const hoursSinceLastSubmission = (currentTime - parseInt(lastSubmissionTime)) / (1000 * 60 * 60);
      const hoursUntilExpire = 24 - hoursSinceLastSubmission;
      
      return Math.max(0, hoursUntilExpire);
    } catch (error) {
      console.error('Error calculating hours until streak expires:', error);
      return 0;
    }
  }

  // Check and reset streak if more than 24 hours have passed
  static async checkAndResetStreakIfNeeded() {
    try {
      const currentTime = Date.now();
      const lastShareDate = await AsyncStorage.getItem(this.LAST_SHARE_DATE_KEY);
      
      if (lastShareDate) {
        const lastShareDateTime = new Date(lastShareDate).getTime();
        const hoursSinceLastShare = (currentTime - lastShareDateTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastShare >= 24) {
          await this.resetStreak();
          console.log('Auto-reset streak: More than 24 hours since last share');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking streak reset:', error);
      return false;
    }
  }

  // Reset streak (for testing or if needed)
  static async resetStreak() {
    try {
      await AsyncStorage.setItem(this.STREAK_KEY, '0');
      await AsyncStorage.removeItem(this.LAST_SUBMISSION_KEY);
      await AsyncStorage.removeItem(this.LAST_SHARE_DATE_KEY);
      console.log('Streak reset to 0');
    } catch (error) {
      console.error('Error resetting streak:', error);
    }
  }
}
