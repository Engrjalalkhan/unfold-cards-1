import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';

const getDynamicStyles = (theme, isDark) => ({
  bgBackground: { backgroundColor: isDark ? '#000000' : theme.colors.background },
  bgSurface: { backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface },
  borderColor: { borderColor: isDark ? '#333' : theme.colors.border },
  shadowColor: { shadowColor: isDark ? '#000' : theme.colors.shadow },
  textPrimary: { color: theme.colors.text },
  textMuted: { color: theme.colors.textMuted },
});

export function NotificationsScreen({ onBack }) {
  const { theme, isDark } = useTheme();
  const dynamicStyles = getDynamicStyles(theme, isDark);
  const todayNotifications = [
    {
      id: 'today-1',
      title: 'Hi Friend! You\'re on 2-day streak. Keep it up!',
      time: '1:08 AM',
      icon: 'flame'
    },
    {
      id: 'today-2',
      title: 'New reply in Relationship',
      subtitle: 'Check out the latest',
      time: '1:08 AM',
      icon: 'heart'
    }
  ];

  const earlierNotifications = [
    {
      id: 'earlier-1',
      title: 'Friendship Zone',
      subtitle: '5 subcategories',
      time: 'View all',
      icon: 'people'
    },
    {
      id: 'earlier-2',
      title: 'Your weekly progress report is ready',
      subtitle: 'Yesterday',
      time: '1:08 AM',
      icon: 'analytics'
    },
    {
      id: 'earlier-3',
      title: 'Family Zone',
      subtitle: '5 subcategories',
      time: 'View all',
      icon: 'home'
    }
  ];

  const renderNotification = (item, variant = 'default') => (
    <View key={item.id} style={[styles.notificationCard, dynamicStyles.bgSurface, dynamicStyles.borderColor, dynamicStyles.shadowColor, variant === 'compact' && { backgroundColor: isDark ? '#1A1A1A' : '#F5ECFE' }]}>
      <View style={styles.notificationContent}>
        <View style={[styles.notificationIcon, { backgroundColor: isDark ? '#8B5CF6' : (variant === 'compact' ? '#9B6BFF' : '#8B5CF6') }]}>
          <Ionicons name={item.icon} size={18} color="#FFFFFF" />
        </View>
        <View style={styles.notificationText}>
          <Text style={[styles.notificationTitle, { color: isDark ? '#FFFFFF' : '#4A3A75' }]}>{item.title}</Text>
          {item.subtitle ? <Text style={[styles.notificationSubtitle, { color: isDark ? '#A0A0A0' : '#7D6BA6' }]}>{item.subtitle}</Text> : null}
        </View>
        <Text style={[styles.notificationTime, { color: isDark ? '#A0A0A0' : '#7D6BA6' }]}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
      <View style={[styles.headerRow, dynamicStyles.bgBackground]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#2F2752'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#3E2C6E' }]}>Notifications</Text>
      </View>

      <ScrollView style={[styles.container, dynamicStyles.bgBackground]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2F2752' }]}>Today</Text>
        {todayNotifications.map((item) => renderNotification(item))}

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#2F2752' }]}>Earlier</Text>
          <Text style={[styles.viewAllText, { color: isDark ? '#8B5CF6' : '#2E6BFF' }]}>View all</Text>
        </View>
        {earlierNotifications.map((item) => renderNotification(item, 'compact'))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10, // Added some top padding to content
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 8,
    position: 'relative',
    width: '100%',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 20,
    zIndex: 1,
    top:50
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3E2C6E',
    textAlign: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2752',
    marginBottom: 16,
    marginTop: 8,
    marginHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  viewAllText: {
    fontSize: 12,
    color: '#2E6BFF',
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F0E5FF',
    shadowColor: 'rgba(90, 60, 180, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  notificationCardCompact: {
    backgroundColor: '#F5ECFE',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationIconCompact: {
    backgroundColor: '#9B6BFF',
  },
  notificationText: {
    flex: 1,
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A3A75',
    textAlign: 'center',
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#7D6BA6',
    marginTop: 2,
    textAlign: 'center',
  },
  notificationTime: {
    fontSize: 11,
    color: '#7D6BA6',
    marginLeft: 12,
  },
  unreadBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
