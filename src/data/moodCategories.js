// Maps mood IDs to question categories
export const moodCategories = {
  'excited': ['fun', 'emotional-zone'],
  'happy': ['fun', 'emotional-zone', 'relationship'],
  'calm': ['emotional-zone', 'family'],
  'neutral': ['emotional-zone', 'friendship'],
  'sad': ['emotional-zone', 'family'],
  'angry': ['emotional-zone', 'friendship'],
  'tired': ['emotional-zone'],
  'overwhelmed': ['emotional-zone', 'family']
};

// Function to get random questions from a category
export const getRandomQuestions = (category, count = 5) => {
  // This will be implemented to fetch questions from the appropriate JSON file
  // For now, return mock data
  return [
    `How does being ${category} affect your day?`,
    `What helps you when you feel ${category}?`,
    `Who do you talk to when you feel ${category}?`,
    `What's one thing you'd like to do when you feel ${category}?`,
    `How do you want others to support you when you're ${category}?`
  ];
};
