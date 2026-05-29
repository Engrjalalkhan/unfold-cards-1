import AsyncStorage from '@react-native-async-storage/async-storage';

export const TRIAL_SUBCATEGORY_IDS = [
  'couple-questions',
  'for-soulmates',
  'couple-therapy',
  'naughty-nights',
  'the-future-us',
];

export const FREE_TRIAL_QUESTIONS = 3;

const storageKey = (subcategoryId) => `TRIAL_MAX_QUESTION_INDEX_${subcategoryId}`;

export function isTrialSubcategory(subcategoryId) {
  return TRIAL_SUBCATEGORY_IDS.includes(subcategoryId);
}

export async function getMaxViewedQuestionIndex(subcategoryId) {
  try {
    const stored = await AsyncStorage.getItem(storageKey(subcategoryId));
    return stored ? parseInt(stored, 10) : -1;
  } catch (error) {
    console.error('Error getting trial question index:', error);
    return -1;
  }
}

export async function recordQuestionView(subcategoryId, index) {
  try {
    const currentMax = await getMaxViewedQuestionIndex(subcategoryId);
    if (index > currentMax) {
      await AsyncStorage.setItem(storageKey(subcategoryId), String(index));
    }
  } catch (error) {
    console.error('Error recording trial question view:', error);
  }
}

export function canViewQuestionIndex(index, isPremium) {
  if (isPremium) {
    return true;
  }
  return index < FREE_TRIAL_QUESTIONS;
}

export async function resetTrialProgress() {
  try {
    await Promise.all(
      TRIAL_SUBCATEGORY_IDS.map((id) => AsyncStorage.removeItem(storageKey(id)))
    );
  } catch (error) {
    console.error('Error resetting trial progress:', error);
  }
}
