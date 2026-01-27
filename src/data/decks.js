// Load data from JSON files
import relJson from './questions.relationship.json';
import friendJson from './questions.friendship.json';
import familyJson from './questions.family.json';
import emotionalJson from './questions.emotional.json';
import funJson from './questions.fun.json';

// Helper function to get first 5 questions from a subcategory
const getFirst5Questions = (subcategories) => {
  const allQuestions = [];
  for (const sub of subcategories) {
    if (sub.questions && Array.isArray(sub.questions)) {
      allQuestions.push(...sub.questions.slice(0, 5));
    }
  }
  return allQuestions.slice(0, 5); // Ensure we only return 5 total
};

// Helper function to get all questions from a subcategory (up to 30)
const getAllQuestions = (subcategory, limit = 30) => {
  if (!subcategory || !subcategory.questions || !Array.isArray(subcategory.questions)) {
    console.warn('Invalid subcategory or questions:', subcategory);
    return [];
  }
  const questions = subcategory.questions.slice(0, limit);
  console.log(`Loaded ${questions.length} questions for subcategory: ${subcategory.name || subcategory.id}`);
  return questions;
};

// Process relationship zone
const relationshipZone = (() => {
  try {
    const data = relJson;
    if (!data || !data.categories || !Array.isArray(data.categories)) {
      return null;
    }
    const zone = data.categories.find(c => c.id === 'relationship-zone');
    if (!zone) return null;
    
    return {
      id: zone.id,
      name: zone.name,
      color: zone.color,
      previewQuestions: getFirst5Questions(zone.subcategories || []),
      subcategories: (zone.subcategories || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        color: sub.color || zone.color, // Use zone color if subcategory color is not defined
        questions: getAllQuestions(sub, 30)
      }))
    };
  } catch (e) {
    console.warn('Error loading relationship zone:', e);
    return null;
  }
})();

console.log('Relationship Zone loaded:', relationshipZone ? `${relationshipZone.subcategories.length} subcategories` : 'Failed');

// Process friendship zone
const friendshipZone = (() => {
  try {
    const data = friendJson;
    if (!data || !data.categories || !Array.isArray(data.categories)) {
      return null;
    }
    const zone = data.categories.find(c => c.id === 'friendship-zone');
    if (!zone) return null;
    
    return {
      id: zone.id,
      name: zone.name,
      color: zone.color,
      previewQuestions: getFirst5Questions(zone.subcategories || []),
      subcategories: (zone.subcategories || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        color: sub.color || zone.color, // Use zone color if subcategory color is not defined
        questions: getAllQuestions(sub, 30)
      }))
    };
  } catch (e) {
    console.warn('Error loading friendship zone:', e);
    return null;
  }
})();

// Process family zone
const familyZone = (() => {
  try {
    const data = familyJson;
    if (!data || !data.categories || !Array.isArray(data.categories)) {
      return null;
    }
    const zone = data.categories.find(c => c.id === 'family-zone');
    if (!zone) return null;
    
    return {
      id: zone.id,
      name: zone.name,
      color: zone.color,
      previewQuestions: getFirst5Questions(zone.subcategories || []),
      subcategories: (zone.subcategories || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        color: sub.color || zone.color, // Use zone color if subcategory color is not defined
        questions: getAllQuestions(sub, 30)
      }))
    };
  } catch (e) {
    console.warn('Error loading family zone:', e);
    return null;
  }
})();

// Process emotional zone
const emotionalZone = (() => {
  try {
    const data = emotionalJson;
    if (!data || !data.categories || !Array.isArray(data.categories)) {
      return null;
    }
    const zone = data.categories.find(c => c.id === 'emotional-zone');
    if (!zone) return null;
    
    return {
      id: zone.id,
      name: zone.name,
      color: zone.color,
      previewQuestions: getFirst5Questions(zone.subcategories || []),
      subcategories: (zone.subcategories || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        color: sub.color || zone.color, // Use zone color if subcategory color is not defined
        questions: getAllQuestions(sub, 30)
      }))
    };
  } catch (e) {
    console.warn('Error loading emotional zone:', e);
    return null;
  }
})();

// Process fun zone
const funZone = (() => {
  try {
    const data = funJson;
    if (!data || !data.categories || !Array.isArray(data.categories)) {
      return null;
    }
    const zone = data.categories.find(c => c.id === 'fun-zone');
    if (!zone) return null;
    
    return {
      id: zone.id,
      name: zone.name,
      color: zone.color,
      previewQuestions: getFirst5Questions(zone.subcategories || []),
      subcategories: (zone.subcategories || []).map(sub => ({
        id: sub.id,
        name: sub.name,
        color: sub.color || zone.color, // Use zone color if subcategory color is not defined
        questions: getAllQuestions(sub, 30)
      }))
    };
  } catch (e) {
    console.warn('Error loading fun zone:', e);
    return null;
  }
})();

// Export zones with preview questions
export const zones = [
  relationshipZone,
  friendshipZone,
  familyZone,
  emotionalZone,
  funZone
].filter(zone => zone !== null);

// Export all subcategories for navigation
export const allSubcategories = zones.flatMap(zone => zone.subcategories);

// Helper function to get subcategory by ID
export const getSubcategoryById = (id) => allSubcategories.find(c => c.id === id);
