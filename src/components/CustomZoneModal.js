import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customZoneStorage } from '../utils/customZoneStorage';
import { triggerCustomZoneAlert } from '../services/notificationService';
import { NEW_CATEGORY_ALERT_KEY } from '../constants/storageKeys';

export function CustomZoneModal({ visible, onClose, theme, isDark, onZoneCreated }) {
  const [step, setStep] = useState(1); // 1: zone, 2: subcategory, 3: questions
  const [zoneName, setZoneName] = useState('');
  const [zoneColor, setZoneColor] = useState('#8B5CF6');
  const [subcategories, setSubcategories] = useState([]);
  const [currentSubcategory, setCurrentSubcategory] = useState('');
  const [currentQuestions, setCurrentQuestions] = useState(['']);
  const [fadeAnim] = useState(new Animated.Value(0));

  const colors = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const resetForm = () => {
    setStep(1);
    setZoneName('');
    setZoneColor('#8B5CF6');
    setSubcategories([]);
    setCurrentSubcategory('');
    setCurrentQuestions(['']);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddSubcategory = () => {
    if (currentSubcategory.trim()) {
      setSubcategories([...subcategories, { 
        name: currentSubcategory.trim(), 
        questions: [],
        id: `temp-${Date.now()}`
      }]);
      setCurrentSubcategory('');
    }
  };

  const handleAddQuestion = (index) => {
    const newQuestions = [...currentQuestions];
    newQuestions.push('');
    setCurrentQuestions(newQuestions);
  };

  const handleQuestionChange = (text, index) => {
    const newQuestions = [...currentQuestions];
    newQuestions[index] = text;
    setCurrentQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = currentQuestions.filter((_, i) => i !== index);
    setCurrentQuestions(newQuestions);
  };

  const handleSaveSubcategoryWithQuestions = () => {
    const validQuestions = currentQuestions.filter(q => q.trim());
    if (currentSubcategory.trim() && validQuestions.length > 0) {
      const updatedSubcategories = [...subcategories];
      const existingIndex = updatedSubcategories.findIndex(
        sub => sub.name === currentSubcategory.trim()
      );
      
      if (existingIndex >= 0) {
        updatedSubcategories[existingIndex].questions = validQuestions;
      } else {
        updatedSubcategories.push({
          name: currentSubcategory.trim(),
          questions: validQuestions,
          id: `temp-${Date.now()}`
        });
      }
      
      setSubcategories(updatedSubcategories);
      setCurrentSubcategory('');
      setCurrentQuestions(['']);
      setStep(2);
    } else {
      Alert.alert('Error', 'Please enter a subcategory name and at least one question.');
    }
  };

  const handleCreateZone = async () => {
    if (!zoneName.trim()) {
      Alert.alert('Error', 'Please enter a zone name.');
      return;
    }

    if (subcategories.length === 0) {
      Alert.alert('Error', 'Please add at least one subcategory.');
      return;
    }

    try {
      const zone = {
        name: zoneName.trim(),
        color: zoneColor,
        subcategories: subcategories.map(sub => ({
          id: `custom-${Date.now()}-${Math.random()}`,
          name: sub.name,
          color: zoneColor,
          questions: sub.questions
        })),
        previewQuestions: subcategories.flatMap(sub => sub.questions).slice(0, 5)
      };

      const savedZone = await customZoneStorage.saveCustomZone(zone);
      onZoneCreated && onZoneCreated(savedZone);
      
      // Check if new category alerts are enabled before sending notification
      const newCategoryAlertsEnabled = await AsyncStorage.getItem(NEW_CATEGORY_ALERT_KEY);
      
      if (newCategoryAlertsEnabled === 'true') {
        // Send notification for custom zone creation only if enabled
        await triggerCustomZoneAlert(
          zone.name,
          zone.subcategories.length,
          zone.subcategories.reduce((total, sub) => total + sub.questions.length, 0)
        );
      } else {
        console.log('🔕 New category alerts disabled - zone created but no notification sent');
      }
      
      Alert.alert('Success', 'Custom zone created successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating custom zone:', error);
      Alert.alert('Error', 'Failed to create custom zone. Please try again.');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
        Create Your Custom Zone
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.colors.textMuted }]}>
        Give your zone a name and choose a color
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Zone Name</Text>
        <TextInput
          style={[
            styles.textInput,
            { 
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: theme.colors.border,
              color: theme.colors.text
            }
          ]}
          value={zoneName}
          onChangeText={setZoneName}
          placeholder="Enter zone name..."
          placeholderTextColor={theme.colors.textMuted}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Zone Color</Text>
        <View style={styles.colorPicker}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                zoneColor === color && styles.selectedColor
              ]}
              onPress={() => setZoneColor(color)}
            >
              {zoneColor === color && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setStep(2)}
        disabled={!zoneName.trim()}
      >
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
        Add Subcategories
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.colors.textMuted }]}>
        Create subcategories for your zone
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Subcategory Name</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={[
              styles.textInput,
              styles.flexInput,
              { 
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderColor: theme.colors.border,
                color: theme.colors.text
              }
            ]}
            value={currentSubcategory}
            onChangeText={setCurrentSubcategory}
            placeholder="Enter subcategory name..."
            placeholderTextColor={theme.colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddSubcategory}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {subcategories.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Subcategories ({subcategories.length})
          </Text>
          {subcategories.map((sub, index) => (
            <View
              key={sub.id}
              style={[
                styles.listItem,
                { 
                  backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                  borderColor: theme.colors.border
                }
              ]}
            >
              <Text style={[styles.listItemText, { color: theme.colors.text }]}>
                {sub.name}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSubcategories(subcategories.filter((_, i) => i !== index));
                }}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => setStep(1)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setStep(3)}
          disabled={subcategories.length === 0}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
        Add Questions
      </Text>
      <Text style={[styles.stepSubtitle, { color: theme.colors.textMuted }]}>
        Add questions to your subcategories
      </Text>

      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Select Subcategory</Text>
        <ScrollView style={styles.subcategoryList} horizontal showsHorizontalScrollIndicator={false}>
          {subcategories.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={[
                styles.subcategoryChip,
                { 
                  backgroundColor: currentSubcategory === sub.name ? zoneColor : (isDark ? '#1E1E1E' : '#FFFFFF'),
                  borderColor: theme.colors.border
                }
              ]}
              onPress={() => {
                setCurrentSubcategory(sub.name);
                setCurrentQuestions(['']);
              }}
            >
              <Text style={[
                styles.chipText,
                { color: currentSubcategory === sub.name ? '#FFFFFF' : theme.colors.text }
              ]}>
                {sub.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {currentSubcategory && (
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Questions for "{currentSubcategory}"
          </Text>
          {currentQuestions.map((question, index) => (
            <View key={index} style={styles.questionInput}>
              <TextInput
                style={[
                  styles.textInput,
                  styles.flexInput,
                  { 
                    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                    borderColor: theme.colors.border,
                    color: theme.colors.text
                  }
                ]}
                value={question}
                onChangeText={(text) => handleQuestionChange(text, index)}
                placeholder={`Question ${index + 1}...`}
                placeholderTextColor={theme.colors.textMuted}
                multiline
              />
              {currentQuestions.length > 1 && (
                <TouchableOpacity
                  onPress={() => handleRemoveQuestion(index)}
                  style={styles.removeButton}
                >
                  <Ionicons name="remove-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addQuestionButton, { borderColor: theme.colors.primary }]}
            onPress={() => handleAddQuestion()}
          >
            <Ionicons name="add" size={16} color={theme.colors.primary} />
            <Text style={[styles.addQuestionText, { color: theme.colors.primary }]}>
              Add Question
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => setStep(2)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSaveSubcategoryWithQuestions}
        >
          <Text style={styles.saveButtonText}>Save & Add More</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleCreateZone}
        >
          <Text style={styles.createButtonText}>Create Zone</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={[
          styles.modalContainer,
          { 
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: theme.colors.border
          }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Custom Zone Creator
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, step >= 1 && { backgroundColor: theme.colors.primary }]} />
            <View style={[styles.progressStep, step >= 2 && { backgroundColor: theme.colors.primary }]} />
            <View style={[styles.progressStep, step >= 3 && { backgroundColor: theme.colors.primary }]} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContainer: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  flexInput: {
    flex: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#000000',
    borderWidth: 3,
  },
  listContainer: {
    maxHeight: 200,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 16,
  },
  subcategoryList: {
    marginBottom: 16,
  },
  subcategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  questionInput: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  removeButton: {
    marginTop: 12,
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  addQuestionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  nextButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#10B981',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
