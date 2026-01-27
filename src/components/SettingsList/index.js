import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getDynamicStyles = (theme) => ({
  bgSurface: { backgroundColor: theme.colors.surface },
  borderColor: { borderColor: theme.colors.border },
  shadowColor: { shadowColor: theme.colors.shadow },
  textPrimary: { color: theme.colors.text },
  textMuted: { color: theme.colors.textMuted },
  textPrimaryText: { color: theme.colors.primaryText },
});

export const SettingsList = React.memo(function SettingsList({ onEditProfile, onEnableNotifications, onSignOut, theme }) {
  const dynamicStyles = getDynamicStyles(theme);
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
  listCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6D6FF', shadowColor: 'rgba(124,77,255,0.18)', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, marginBottom: 12 },
  listItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E6D6FF' },
  listIconI: { marginRight: 12 },
  listItemText: { color: '#2F2752', fontSize: 16, flex: 1 },
  listChevron: { color: '#7A6FA3', fontSize: 22 },
});
