import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export function CustomAlert({
  visible,
  title,
  message,
  buttons = [],
  onClose,
  type = 'default' // 'default', 'delete', 'success'
}) {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.9));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const getAlertStyle = () => {
    switch (type) {
      case 'delete':
        return {
          icon: 'warning',
          iconColor: '#EF4444',
          borderColor: '#FEE2E2',
          bgColor: '#FFFFFF'
        };
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#10B981',
          borderColor: '#D1FAE5',
          bgColor: '#FFFFFF'
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: '#3B82F6',
          borderColor: '#DBEAFE',
          bgColor: '#FFFFFF'
        };
    }
  };

  const alertStyle = getAlertStyle();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View 
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
              borderColor: alertStyle.borderColor,
              backgroundColor: alertStyle.bgColor
            }
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={alertStyle.icon} 
              size={48} 
              color={alertStyle.iconColor} 
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {message && (
            <Text style={styles.message}>{message}</Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' && styles.destructiveButton,
                  button.style === 'cancel' && styles.cancelButton,
                  button.style === 'default' && styles.defaultButton,
                ]}
                onPress={() => {
                  button.onPress && button.onPress();
                  if (button.closeOnPress !== false) {
                    onClose();
                  }
                }}
              >
                <Text style={[
                  styles.buttonText,
                  button.style === 'destructive' && styles.destructiveButtonText,
                  button.style === 'cancel' && styles.cancelButtonText,
                  button.style === 'default' && styles.defaultButtonText,
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Helper function to show custom alert
let alertRef = null;

export const showCustomAlert = (options) => {
  if (alertRef) {
    alertRef.show(options);
  }
};

export const hideCustomAlert = () => {
  if (alertRef) {
    alertRef.hide();
  }
};

export const CustomAlertProvider = ({ children }) => {
  const [alert, setAlert] = React.useState(null);

  React.useEffect(() => {
    alertRef = {
      show: (options) => {
        setAlert(options);
      },
      hide: () => {
        setAlert(null);
      }
    };

    return () => {
      alertRef = null;
    };
  }, []);

  return (
    <>
      {children}
      <CustomAlert
        visible={!!alert}
        title={alert?.title || ''}
        message={alert?.message || ''}
        buttons={alert?.buttons || []}
        onClose={() => setAlert(null)}
        type={alert?.type || 'default'}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1F2937',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    color: '#6B7280',
  },
  buttonContainer: {
    width: '100%',
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  defaultButton: {
    backgroundColor: '#3B82F6',
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
});
