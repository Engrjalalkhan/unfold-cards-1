import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';

const getDynamicStyles = (theme) => ({
  bgBackground: { backgroundColor: theme.colors.background },
  bgSurface: { backgroundColor: theme.colors.surface },
  borderColor: { borderColor: theme.colors.border },
  shadowColor: { shadowColor: theme.colors.shadow },
  textPrimary: { color: theme.colors.text },
  textMuted: { color: theme.colors.textMuted },
});

export function NotificationsScreen({ onBack }) {
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
    <View key={item.id} style={[styles.notificationCard, variant === 'compact' && styles.notificationCardCompact]}>
      <View style={styles.notificationContent}>
        <View style={[styles.notificationIcon, variant === 'compact' && styles.notificationIconCompact]}>
          <Ionicons name={item.icon} size={18} color="#FFFFFF" />
        </View>
        <View style={styles.notificationText}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {item.subtitle ? <Text style={styles.notificationSubtitle}>{item.subtitle}</Text> : null}
        </View>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color="#2F2752" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Today</Text>
        {todayNotifications.map((item) => renderNotification(item))}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Earlier</Text>
          <Text style={styles.viewAllText}>View all</Text>
        </View>
        {earlierNotifications.map((item) => renderNotification(item, 'compact'))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EADCF6',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F6F0FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3E2C6E',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A3A75',
    marginTop: 18,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  viewAllText: {
    fontSize: 12,
    color: '#2E6BFF',
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: '#F3EAFE',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E3D0F6',
  },
  notificationCardCompact: {
    backgroundColor: '#F5ECFE',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4A3A75',
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#7D6BA6',
    marginTop: 2,
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
