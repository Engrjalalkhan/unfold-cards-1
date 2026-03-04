import AsyncStorage from '@react-native-async-storage/async-storage';

const CUSTOM_ZONES_KEY = 'customZones';

export const customZoneStorage = {
  // Get all custom zones
  async getCustomZones() {
    try {
      const stored = await AsyncStorage.getItem(CUSTOM_ZONES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting custom zones:', error);
      return [];
    }
  },

  // Save a new custom zone
  async saveCustomZone(zone) {
    try {
      const customZones = await this.getCustomZones();
      const newZone = {
        ...zone,
        id: `custom-${Date.now()}`,
        createdAt: new Date().toISOString(),
        isCustom: true
      };
      customZones.push(newZone);
      await AsyncStorage.setItem(CUSTOM_ZONES_KEY, JSON.stringify(customZones));
      return newZone;
    } catch (error) {
      console.error('Error saving custom zone:', error);
      throw error;
    }
  },

  // Update an existing custom zone
  async updateCustomZone(zoneId, updates) {
    try {
      const customZones = await this.getCustomZones();
      const index = customZones.findIndex(z => z.id === zoneId);
      if (index !== -1) {
        customZones[index] = { ...customZones[index], ...updates };
        await AsyncStorage.setItem(CUSTOM_ZONES_KEY, JSON.stringify(customZones));
        return customZones[index];
      }
      return null;
    } catch (error) {
      console.error('Error updating custom zone:', error);
      throw error;
    }
  },

  // Delete a custom zone
  async deleteCustomZone(zoneId) {
    try {
      const customZones = await this.getCustomZones();
      const filtered = customZones.filter(z => z.id !== zoneId);
      await AsyncStorage.setItem(CUSTOM_ZONES_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting custom zone:', error);
      throw error;
    }
  },

  // Add a subcategory to a custom zone
  async addSubcategoryToZone(zoneId, subcategory) {
    try {
      const customZones = await this.getCustomZones();
      const zone = customZones.find(z => z.id === zoneId);
      if (zone) {
        const newSubcategory = {
          ...subcategory,
          id: `custom-sub-${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        zone.subcategories = zone.subcategories || [];
        zone.subcategories.push(newSubcategory);
        await AsyncStorage.setItem(CUSTOM_ZONES_KEY, JSON.stringify(customZones));
        return newSubcategory;
      }
      return null;
    } catch (error) {
      console.error('Error adding subcategory to zone:', error);
      throw error;
    }
  },

  // Add a question to a subcategory
  async addQuestionToSubcategory(zoneId, subcategoryId, question) {
    try {
      const customZones = await this.getCustomZones();
      const zone = customZones.find(z => z.id === zoneId);
      if (zone) {
        const subcategory = zone.subcategories.find(s => s.id === subcategoryId);
        if (subcategory) {
          subcategory.questions = subcategory.questions || [];
          const newQuestion = {
            ...question,
            id: `custom-q-${Date.now()}`,
            createdAt: new Date().toISOString()
          };
          subcategory.questions.push(newQuestion.question);
          await AsyncStorage.setItem(CUSTOM_ZONES_KEY, JSON.stringify(customZones));
          return newQuestion;
        }
      }
      return null;
    } catch (error) {
      console.error('Error adding question to subcategory:', error);
      throw error;
    }
  }
};
