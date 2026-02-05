import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
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
  onSignOut, 
  theme,
  isDark = false 
}) {
  const dynamicStyles = getDynamicStyles(theme, isDark);
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
      <TouchableOpacity style={[styles.listItemRow, dynamicStyles.borderColor]}>
        <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primaryText} style={styles.listIconI} />
        <Text style={[styles.listItemText, dynamicStyles.textPrimary]}>Privacy & Support</Text>
        <Text style={[styles.listChevron, dynamicStyles.textMuted]}>›</Text>
      </TouchableOpacity>
      {onSignOut && (
        <TouchableOpacity style={[styles.listItemRow, dynamicStyles.borderColor]} onPress={onSignOut}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.primaryText} style={styles.listIconI} />
          <Text style={[styles.listItemText, dynamicStyles.textPrimaryText]}>Sign Out</Text>
          <Text style={[styles.listChevron, dynamicStyles.textMuted]}>›</Text>
        </TouchableOpacity>
      )}
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
});
