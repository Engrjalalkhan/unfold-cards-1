import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBCATEGORY_OPEN_COUNT_KEY = 'SUBCATEGORY_OPEN_COUNT';
const FREE_SUBCATEGORY_OPENS = 3;

export async function getSubcategoryOpenCount() {
  try {
    const count = await AsyncStorage.getItem(SUBCATEGORY_OPEN_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting subcategory open count:', error);
    return 0;
  }
}

export async function canOpenSubcategory() {
  const count = await getSubcategoryOpenCount();
  return count < FREE_SUBCATEGORY_OPENS;
}

export async function recordSubcategoryOpen() {
  try {
    const count = await getSubcategoryOpenCount();
    await AsyncStorage.setItem(SUBCATEGORY_OPEN_COUNT_KEY, String(count + 1));
  } catch (error) {
    console.error('Error recording subcategory open:', error);
  }
}

export async function resetSubcategoryOpenCount() {
  try {
    await AsyncStorage.removeItem(SUBCATEGORY_OPEN_COUNT_KEY);
  } catch (error) {
    console.error('Error resetting subcategory open count:', error);
  }
}
