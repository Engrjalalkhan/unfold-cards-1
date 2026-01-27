import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  TextInput, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const QuestionCardModal = ({ visible, question, onClose }) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      Alert.alert('Error', 'Please enter your answer before submitting');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically send the answer to your backend
      console.log('Submitting answer:', { question, answer });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success feedback
      Alert.alert(
        'Thank You!',
        'Your answer has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setAnswer('');
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B4EFF" />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>Your Question</Text>
          <View style={styles.card}>
            <Text style={styles.questionText}>{question}</Text>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Type your answer here..."
            placeholderTextColor="#999"
            multiline
            value={answer}
            onChangeText={setAnswer}
            editable={!isSubmitting}
          />
          
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={[styles.actionButtonText, { color: '#6B4EFF' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.primaryButton,
                isSubmitting && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={[styles.actionButtonText, { color: 'white' }]}>
                  Submit Answer
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2F2752',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#F8F7FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#E6D6FF',
  },
  questionText: {
    fontSize: 18,
    color: '#2F2752',
    lineHeight: 26,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E6D6FF',
  },
  primaryButton: {
    backgroundColor: '#6B4EFF',
    borderColor: '#6B4EFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B4EFF',
  },
  input: {
    width: '100%',
    minHeight: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6D6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#2F2752',
  },
  disabledButton: {
    opacity: 0.7,
  },
  secondaryButton: {
    backgroundColor: '#F0ECFF',
  },
});

export default QuestionCardModal;
