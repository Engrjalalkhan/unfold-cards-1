import AsyncStorage from '@react-native-async-storage/async-storage';

export class StreakManager {
  static STREAK_KEY = 'userStreak';
  static LAST_SHARE_DATE_KEY = 'lastShareDate';
  static STREAK_START_DATE_KEY = 'streakStartDate';

  // Get current streak data
  static async getStreakData() {
    try {
      const streakData = await AsyncStorage.getItem(this.STREAK_KEY);
      const lastShareDate = await AsyncStorage.getItem(this.LAST_SHARE_DATE_KEY);
      const streakStartDate = await AsyncStorage.getItem(this.STREAK_START_DATE_KEY);
      
      return {
        streakDays: streakData ? parseInt(streakData) : 0,
        lastShareDate: lastShareDate || null,
        streakStartDate: streakStartDate || null
      };
    } catch (error) {
      console.error('Error getting streak data:', error);
      return { streakDays: 0, lastShareDate: null, streakStartDate: null };
    }
  }

  // Get today's date string (YYYY-MM-DD format)
  static getTodayString() {
    return new Date().toISOString().split('T')[0];
  }

  // Check if user has already shared today
  static async hasSharedToday() {
    try {
      const lastShareDate = await AsyncStorage.getItem(this.LAST_SHARE_DATE_KEY);
      if (!lastShareDate) return false;
      
      const today = this.getTodayString();
      return lastShareDate === today;
    } catch (error) {
      console.error('Error checking if shared today:', error);
      return false;
    }
  }

  // Update streak when user SHARES a question
  static async updateStreak() {
    try {
      const today = this.getTodayString();
      const { streakDays, lastShareDate, streakStartDate } = await this.getStreakData();
      const hasSharedToday = await this.hasSharedToday();

      let newStreak = streakDays;
      let newStartDate = streakStartDate;

      // Check if streak should be continued or reset
      if (lastShareDate) {
        const lastShareDateObj = new Date(lastShareDate);
        const todayDateObj = new Date(today);
        const daysDiff = Math.floor((todayDateObj - lastShareDateObj) / (1000 * 60 * 60 * 24));
        
        console.log('Days since last share:', daysDiff);
        
        if (daysDiff > 1) {
          // More than 1 day gap, reset streak
          newStreak = 1;
          newStartDate = today;
          console.log('Streak reset due to gap, starting new streak at 1');
        } else if (daysDiff === 1) {
          // Exactly 1 day gap, continue streak
          newStreak = streakDays + 1;
          console.log('Continuing streak, new streak:', newStreak);
        }
        // If daysDiff === 0, same day, handled below
      } else {
        // First time sharing
        newStreak = 1;
        newStartDate = today;
        console.log('First share, starting streak at 1');
      }

      // Only update if haven't shared today
      if (!hasSharedToday) {
        await AsyncStorage.setItem(this.STREAK_KEY, newStreak.toString());
        await AsyncStorage.setItem(this.LAST_SHARE_DATE_KEY, today);
        if (newStartDate) {
          await AsyncStorage.setItem(this.STREAK_START_DATE_KEY, newStartDate);
        }
        console.log('Streak updated successfully to:', newStreak);
      } else {
        console.log('Already shared today, streak remains:', streakDays);
        newStreak = streakDays;
      }

      return newStreak;
    } catch (error) {
      console.error('Error updating streak:', error);
      return 0;
    }
  }

  // Check and reset streak if more than 24 hours have passed
  static async checkAndResetStreakIfNeeded() {
    try {
      const { lastShareDate } = await this.getStreakData();
      
      if (lastShareDate) {
        const today = this.getTodayString();
        const lastShareDateObj = new Date(lastShareDate);
        const todayDateObj = new Date(today);
        const daysDiff = Math.floor((todayDateObj - lastShareDateObj) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) {
          await this.resetStreak();
          console.log('Auto-reset streak: More than 1 day gap since last share');
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
      await AsyncStorage.removeItem(this.LAST_SHARE_DATE_KEY);
      await AsyncStorage.removeItem(this.STREAK_START_DATE_KEY);
      console.log('Streak reset to 0');
    } catch (error) {
      console.error('Error resetting streak:', error);
    }
  }

  // Get streak info for display
  static async getStreakInfo() {
    try {
      const { streakDays, lastShareDate, streakStartDate } = await this.getStreakData();
      const hasSharedToday = await this.hasSharedToday();
      
      return {
        streakDays,
        lastShareDate,
        streakStartDate,
        hasSharedToday,
        canShareToday: !hasSharedToday
      };
    } catch (error) {
      console.error('Error getting streak info:', error);
      return {
        streakDays: 0,
        lastShareDate: null,
        streakStartDate: null,
        hasSharedToday: false,
        canShareToday: true
      };
    }
  }
}
