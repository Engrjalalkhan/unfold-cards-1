// Example of how to navigate to SubcategoryQuestionsScreen with onboarding cards
// You can add this to any screen to test the SubcategoryQuestionsScreen

import { zones } from '../data/decks';

// Example usage in HomeScreen or any other screen:
const handleNavigateToSubcategory = () => {
  // Get the first subcategory from the first zone as an example
  const firstZone = zones[0];
  const firstSubcategory = firstZone?.subcategories?.[0];
  
  if (firstSubcategory) {
    navigation.navigate('SubcategoryQuestions', {
      subcategory: {
        id: firstSubcategory.id,
        name: firstSubcategory.name,
        questions: firstSubcategory.questions.slice(0, 30), // Show up to 30 questions
        color: firstSubcategory.color || firstZone.color || '#8B5CF6',
        zone: firstZone.name
      }
    });
  }
};

// Example button to add to any screen:
<TouchableOpacity 
  onPress={handleNavigateToSubcategory}
  style={{
    backgroundColor: '#8343b1ff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20
  }}
>
  <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
    Test Subcategory Questions (Onboarding Cards)
  </Text>
</TouchableOpacity>
