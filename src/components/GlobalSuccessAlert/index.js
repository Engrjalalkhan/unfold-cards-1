import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

// Global state that persists across all components
let globalAlertState = {
  visible: false,
  message: '',
  forceUpdate: null
};

export const showGlobalSuccessAlert = (message) => {
  console.log('🌍 GLOBAL SUCCESS ALERT:', message);
  globalAlertState.visible = true;
  globalAlertState.message = message;
  console.log('🔒 GLOBAL ALERT STATE SET TO TRUE');
  
  // Force update
  if (globalAlertState.forceUpdate) {
    globalAlertState.forceUpdate();
  }
};

export const hideGlobalSuccessAlert = () => {
  console.log('🌍 HIDING GLOBAL SUCCESS ALERT');
  globalAlertState.visible = false;
  globalAlertState.message = '';
  console.log('❌ GLOBAL ALERT STATE SET TO FALSE');
  
  // Force update
  if (globalAlertState.forceUpdate) {
    globalAlertState.forceUpdate();
  }
};

export function GlobalSuccessAlert() {
  const { theme, isDark } = useTheme();
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  // Store force update function in global state
  React.useEffect(() => {
    globalAlertState.forceUpdate = forceUpdate;
    console.log('🔧 GLOBAL ALERT FORCE UPDATE FUNCTION SET');
  }, [forceUpdate]);

  console.log('🌍 GLOBAL ALERT RENDERING - VISIBLE:', globalAlertState.visible);

  if (!globalAlertState.visible) {
    return null;
  }

  return (
    <View style={styles.absoluteOverlay}>
      <View style={[styles.customAlertContainer, { 
        backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        borderColor: isDark ? '#333' : '#E6D6FF',
        bottom:200
      }]}>
        {/* Success Icon */}
        <View style={[styles.successIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
          <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary} />
        </View>
        
        <Text style={[styles.customAlertTitle, { color: isDark ? '#FFFFFF' : theme.colors.text }]}>
          Success!
        </Text>
        <Text style={[styles.customAlertMessage, { color: isDark ? '#A0A0A0' : theme.colors.textMuted }]}>
          {globalAlertState.message}
        </Text>
        
        <View style={styles.customAlertButtons}>
          <TouchableOpacity
            style={[styles.customAlertButton, styles.successButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              console.log('🔘 GLOBAL OK BUTTON PRESSED');
              hideGlobalSuccessAlert();
            }}
          >
            <Text style={styles.successButtonText}>
              OK
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99999, // Highest possible z-index
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
    alignSelf: 'center',
    marginHorizontal: 20,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  customAlertButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  successButton: {
    borderWidth: 0,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
