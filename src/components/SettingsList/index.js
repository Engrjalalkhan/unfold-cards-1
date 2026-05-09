import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Alert, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getDynamicStyles = (theme, isDark) => ({
  bgSurface: { 
    backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface,
    shadowColor: isDark ? '#000' : 'rgba(90, 60, 180, 0.25)',
  },
  borderColor: { 
    borderColor: isDark ? '#333' : theme.colors.border,
    borderBottomColor: isDark ? '#333' : '#E6D6FF',
  },
  textPrimary: { 
    color: isDark ? '#FFFFFF' : theme.colors.text 
  },
  textMuted: { 
    color: isDark ? '#A0A0A0' : theme.colors.textMuted 
  },
  textPrimaryText: { 
    color: isDark ? '#FFFFFF' : theme.colors.primaryText 
  },
});

export const SettingsList = React.memo(function SettingsList({ 
  onEditProfile, 
  onEnableNotifications, 
  theme,
  isDark = false 
}) {
  const dynamicStyles = getDynamicStyles(theme, isDark);
  const [showPrivacyAlert, setShowPrivacyAlert] = React.useState(false);

  const handlePrivacyPolicy = async () => {
    setShowPrivacyAlert(true);
  };

  const handlePrivacyAlertOption = async (option) => {
    setShowPrivacyAlert(false);
    
    if (option === 'privacy') {
      const privacyUrl = 'https://www.termsfeed.com/live/6a758b13-646a-4c73-9309-1d0b4022e040';
      
      try {
        // Check if the URL can be opened
        const supported = await Linking.canOpenURL(privacyUrl);
        
        if (supported) {
          await Linking.openURL(privacyUrl);
          console.log('Opening privacy policy:', privacyUrl);
        } else {
          Alert.alert(
            'Cannot Open Link',
            'Unable to open the privacy policy URL. Please try again later.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      } catch (error) {
        console.error('Error opening privacy policy:', error);
        Alert.alert('Error', 'Failed to open privacy policy. Please try again later.');
      }
    } else if (option === 'terms') {
      const termsUrl = 'https://www.termsfeed.com/live/6a758b13-646a-4c73-9309-1d0b4022e040';
      
      try {
        // Check if the URL can be opened
        const supported = await Linking.canOpenURL(termsUrl);
        
        if (supported) {
          await Linking.openURL(termsUrl);
          console.log('Opening terms of service:', termsUrl);
        } else {
          Alert.alert(
            'Cannot Open Link',
            'Unable to open the terms of service URL. Please try again later.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      } catch (error) {
        console.error('Error opening terms of service:', error);
        Alert.alert('Error', 'Failed to open terms of service. Please try again later.');
      }
    }
  };

  return (
    <View style={[styles.listCard, dynamicStyles.bgSurface, dynamicStyles.borderColor, dynamicStyles.shadowColor]}>
      <TouchableOpacity style={[styles.listItemRow, dynamicStyles.borderColor]} onPress={onEditProfile}>
        <Ionicons name="book-outline" size={20} color={theme.colors.primaryText} style={styles.listIconI} />
        <Text style={[styles.listItemText, dynamicStyles.textPrimary]}>Edit Profile & Account</Text>
        <Text style={[styles.listChevron, dynamicStyles.textMuted]}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.listItemRow, dynamicStyles.borderColor]} onPress={onEnableNotifications}>
        <Ionicons name="notifications-outline" size={20} color={theme.colors.primaryText} style={styles.listIconI} />
        <Text style={[styles.listItemText, dynamicStyles.textPrimary]}>Notifications</Text>
        <Text style={[styles.listChevron, dynamicStyles.textMuted]}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.listItemRow, dynamicStyles.borderColor]} onPress={handlePrivacyPolicy}>
        <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primaryText} style={styles.listIconI} />
        <Text style={[styles.listItemText, dynamicStyles.textPrimary]}>Privacy & Support</Text>
        <Text style={[styles.listChevron, dynamicStyles.textMuted]}>›</Text>
      </TouchableOpacity>
      
      {/* Custom Privacy Policy Alert */}
      <Modal
        visible={showPrivacyAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPrivacyAlert(false)}
      >
        <View style={styles.customAlertOverlay}>
          <View style={[styles.customAlertContainer, { 
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDark ? '#333' : '#E6D6FF'
          }]}>
            <Text style={[styles.customAlertTitle, dynamicStyles.textPrimary]}>
              Privacy & Support
            </Text>
            <Text style={[styles.customAlertMessage, dynamicStyles.textMuted]}>
              View our Privacy Policy and Terms of Service to learn how we protect your data and handle your information responsibly.
            </Text>
            
            <View style={styles.customAlertButtons}>
              <TouchableOpacity
                style={[styles.customAlertButton, styles.openButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handlePrivacyAlertOption('privacy')}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.openButtonText}>
                  Privacy Policy
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.customAlertButton, styles.openButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => handlePrivacyAlertOption('terms')}
              >
                <Ionicons name="document-text-outline" size={18} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.openButtonText}>
                  Terms of Service
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.customAlertButton, styles.cancelButton, { 
                  backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
                  borderColor: isDark ? '#444' : '#DDD'
                }]}
                onPress={() => setShowPrivacyAlert(false)}
              >
                <Text style={[styles.cancelButtonText, { color: isDark ? '#A0A0A0' : '#666' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  listCard: { 
    borderRadius: 18, 
    borderWidth: 1, 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
    overflow: 'hidden'
  },
  listItemRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1 
  },
  listIconI: { 
    marginRight: 12 
  },
  listItemText: { 
    fontSize: 16, 
    flex: 1 
  },
  listChevron: { 
    fontSize: 22 
  },
  // Custom Alert styles
  customAlertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  customAlertContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  customAlertTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  customAlertMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  customAlertButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  customAlertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openButton: {
    borderWidth: 0,
  },
  openButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
});
