import AsyncStorage from '@react-native-async-storage/async-storage';
import { STATS_STORAGE_KEY } from '../constants/storageKeys';

export class StatsManager {
  // Get current stats
  static async getStats() {
    try {
      const stats = await AsyncStorage.getItem(STATS_STORAGE_KEY);
      return stats ? JSON.parse(stats) : {
        questionsRead: 0,
        timesShared: 0,
        streakDays: 0,
        totalSessions: 0,
        lastReadDate: null,
        lastShareDate: null,
        currentZone: null,
        viewedZones: [] // Track all zones the user has interacted with
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        questionsRead: 0,
        timesShared: 0,
        streakDays: 0,
        totalSessions: 0,
        lastReadDate: null,
        lastShareDate: null,
        currentZone: null,
        viewedZones: []
      };
    }
  }

  // Add zone to viewed zones
  static async addViewedZone(zoneId) {
    try {
      const stats = await this.getStats();
      
      // Only add zone if not already tracked
      if (!stats.viewedZones.includes(zoneId)) {
        stats.viewedZones.push(zoneId);
        await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
        console.log('Added zone to viewed zones:', zoneId);
      }
      
      return stats;
    } catch (error) {
      console.error('Error adding viewed zone:', error);
      return null;
    }
  }

  // Increment questions read
  static async incrementQuestionsRead(zone = null) {
    try {
      const stats = await this.getStats();
      stats.questionsRead += 1;
      stats.lastReadDate = new Date().toISOString();
      
      // Update current zone if provided
      if (zone) {
        stats.currentZone = zone;
      }
      
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
      console.log('Questions read incremented to:', stats.questionsRead, 'Zone:', stats.currentZone);
      return stats;
    } catch (error) {
      console.error('Error incrementing questions read:', error);
      return null;
    }
  }

  // Increment times shared
  static async incrementTimesShared(zone = null) {
    try {
      const stats = await this.getStats();
      stats.timesShared += 1;
      stats.lastShareDate = new Date().toISOString();
      
      // Update current zone if provided
      if (zone) {
        stats.currentZone = zone;
      }
      
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
      console.log('Times shared incremented to:', stats.timesShared, 'Zone:', stats.currentZone);
      return stats;
    } catch (error) {
      console.error('Error incrementing times shared:', error);
      return null;
    }
  }

  // Update streak days
  static async updateStreakDays(days) {
    try {
      const stats = await this.getStats();
      stats.streakDays = days;
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
      console.log('Streak days updated to:', stats.streakDays);
      return stats;
    } catch (error) {
      console.error('Error updating streak days:', error);
      return null;
    }
  }

  // Increment total sessions
  static async incrementTotalSessions() {
    try {
      const stats = await this.getStats();
      stats.totalSessions += 1;
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
      console.log('Total sessions incremented to:', stats.totalSessions);
      return stats;
    } catch (error) {
      console.error('Error incrementing total sessions:', error);
      return null;
    }
  }

  // Reset all stats
  static async resetStats() {
    try {
      const defaultStats = {
        questionsRead: 0,
        timesShared: 0,
        streakDays: 0,
        totalSessions: 0,
        lastReadDate: null,
        lastShareDate: null,
        currentZone: null,
        viewedZones: []
      };
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(defaultStats));
      console.log('Stats reset to default');
      return defaultStats;
    } catch (error) {
      console.error('Error resetting stats:', error);
      return null;
    }
  }
}
