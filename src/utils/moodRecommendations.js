// Mood-based question and quotation recommendations
export const moodRecommendations = {
  happy: {
    keywords: ['joy', 'celebration', 'gratitude', 'happiness', 'excitement', 'love', 'appreciation'],
    zonePreferences: ['relationship-zone', 'friendship-zone', 'fun-zone'],
    quote: "Happiness is not something ready made. It comes from your own actions. - Dalai Lama",
    suggestedQuestions: [
      "What made you smile today?",
      "What are you most grateful for right now?",
      "What's something that always brings you joy?",
      "How do you celebrate your wins?",
      "What makes your heart feel full?"
    ]
  },
  sad: {
    keywords: ['comfort', 'support', 'healing', 'understanding', 'empathy', 'care'],
    zonePreferences: ['relationship-zone', 'friendship-zone', 'emotional-zone'],
    quote: "Tears are words that need to be written. - Paulo Coelho",
    suggestedQuestions: [
      "What would comfort you right now?",
      "How can I support you better?",
      "What do you need to hear right now?",
      "What helps you feel understood?",
      "What brings you peace when you're feeling down?"
    ]
  },
  anxious: {
    keywords: ['calm', 'reassurance', 'safety', 'grounding', 'peace', 'stability'],
    zonePreferences: ['emotional-zone', 'relationship-zone', 'family-zone'],
    quote: "Anxiety is the dizziness of freedom. - Søren Kierkegaard",
    suggestedQuestions: [
      "What helps you feel grounded?",
      "What makes you feel safe?",
      "How can we create more stability?",
      "What calms your mind?",
      "What would help you breathe easier right now?"
    ]
  },
  excited: {
    keywords: ['adventure', 'future', 'dreams', 'possibilities', 'enthusiasm', 'energy'],
    zonePreferences: ['fun-zone', 'relationship-zone', 'friendship-zone'],
    quote: "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
    suggestedQuestions: [
      "What adventure are you most excited about?",
      "What dreams are you chasing?",
      "What possibilities are you exploring?",
      "What energizes you most?",
      "What future are you building?"
    ]
  },
  thoughtful: {
    keywords: ['reflection', 'growth', 'wisdom', 'insight', 'understanding', 'perspective'],
    zonePreferences: ['emotional-zone', 'relationship-zone', 'family-zone'],
    quote: "The unexamined life is not worth living. - Socrates",
    suggestedQuestions: [
      "What have you learned recently?",
      "How have you grown this year?",
      "What wisdom would you share?",
      "What perspective has shifted for you?",
      "What insights are you discovering?"
    ]
  },
  grateful: {
    keywords: ['appreciation', 'thankfulness', 'blessings', 'abundance', 'gratitude'],
    zonePreferences: ['relationship-zone', 'friendship-zone', 'family-zone'],
    quote: "Gratitude turns what we have into enough. - Anonymous",
    suggestedQuestions: [
      "What are you thankful for today?",
      "Who has made a difference in your life?",
      "What blessings do you often overlook?",
      "What makes you feel abundant?",
      "How do you express gratitude?"
    ]
  }
};

// Get mood-based recommendations for a specific mood
export const getMoodRecommendations = (mood) => {
  if (!mood || typeof mood !== 'string') {
    return moodRecommendations.thoughtful;
  }
  return moodRecommendations[mood.toLowerCase()] || moodRecommendations.thoughtful;
};

// Filter questions based on mood keywords
export const filterQuestionsByMood = (questions, mood) => {
  const moodData = getMoodRecommendations(mood);
  const keywords = moodData.keywords.map(k => k.toLowerCase());
  
  return questions.filter(question => {
    const questionLower = question.toLowerCase();
    return keywords.some(keyword => questionLower.includes(keyword));
  });
};

// Get recommended zones for a mood
export const getRecommendedZones = (mood) => {
  const moodData = getMoodRecommendations(mood);
  return moodData.zonePreferences;
};

// Check if a zone is recommended for a mood
export const isZoneRecommended = (zoneId, mood) => {
  if (!mood || typeof mood !== 'string' || !zoneId) {
    return false;
  }
  const recommendedZones = getRecommendedZones(mood);
  return recommendedZones.includes(zoneId);
};
