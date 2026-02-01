import AsyncStorage from '@react-native-async-storage/async-storage';

export class StreakManager {
  static STREAK_KEY = 'userStreak';
  static LAST_SUBMISSION_KEY = 'lastSubmissionTime';

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

  // Update streak when user submits any question
  static async updateStreak() {
    try {
      const currentTime = Date.now();
      const { streakDays, lastSubmissionTime } = await this.getStreakData();

      let newStreak = streakDays;
      
      if (lastSubmissionTime) {
        const hoursSinceLastSubmission = (currentTime - lastSubmissionTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastSubmission < 24) {
          // Submitted within 24 hours, increment streak
          newStreak = streakDays + 1;
          console.log(`Submitted within ${hoursSinceLastSubmission.toFixed(1)} hours, incrementing streak to:`, newStreak);
        } else {
          // More than 24 hours since last submission, reset streak
          newStreak = 1;
          console.log(`More than 24 hours since last submission (${hoursSinceLastSubmission.toFixed(1)} hours), starting new streak at:`, newStreak);
        }
      } else {
        // First time submitting
        newStreak = 1;
        console.log('First submission, starting streak at:', newStreak);
      }

      // Save new streak data
      await AsyncStorage.setItem(this.STREAK_KEY, newStreak.toString());
      await AsyncStorage.setItem(this.LAST_SUBMISSION_KEY, currentTime.toString());

      console.log('Streak updated:', { streakDays: newStreak, lastSubmissionTime: currentTime });
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
