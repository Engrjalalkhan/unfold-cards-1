import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { getStoredNotifications, markNotificationAsRead, clearAllNotifications } from '../../services/notificationService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  // Load notifications on component mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const storedNotifications = await getStoredNotifications();
        setNotifications(storedNotifications);
        setLoading(false);
      } catch (error) {
        console.error('Error loading notifications:', error);
        setLoading(false);
      }
    };
    
    loadNotifications();
  }, []);

  // Group notifications by zone
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const zone = notification.zone || 'General';
    if (!groups[zone]) {
      groups[zone] = [];
    }
    groups[zone].push(notification);
    return groups;
  }, {});

  const handleClearAll = async () => {
    await clearAllNotifications();
    setNotifications([]);
    setSelectedNotifications(new Set());
  };

  const handleNotificationPress = (item) => {
    // If in selection mode, toggle selection
    if (selectedNotifications.size > 0) {
      const newSelected = new Set(selectedNotifications);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedNotifications(newSelected);
    } else {
      // Normal tap - mark as read and handle normally
      markNotificationAsRead(item.id);
      setNotifications(notifications.map(notif => 
        notif.id === item.id ? { ...notif, read: true } : notif
      ));
    }
  };

  const handleNotificationLongPress = (item) => {
    // Toggle selection on long press
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedNotifications(newSelected);
  };

  const clearSelection = () => {
    setSelectedNotifications(new Set());
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      // Filter out selected notifications
      const updatedNotifications = notifications.filter(notif => !selectedNotifications.has(notif.id));
      setNotifications(updatedNotifications);
      
      // Update storage
      await AsyncStorage.setItem('RECEIVED_NOTIFICATIONS', JSON.stringify(updatedNotifications));
      
      // Clear selection
      setSelectedNotifications(new Set());
      
      console.log(`🗑️ Deleted ${selectedNotifications.size} notifications`);
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }
  };

  const renderNotification = (item) => {
    const isSelected = selectedNotifications.has(item.id);
    
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[
          styles.notificationCard, 
          dynamicStyles.bgSurface, 
          dynamicStyles.borderColor, 
          dynamicStyles.shadowColor,
          isSelected && styles.selectedNotificationCard
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleNotificationLongPress(item)}
        delayLongPress={300}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.notificationIcon, { backgroundColor: isDark ? '#8B5CF6' : '#8B5CF6' }]}>
            <Ionicons name={getNotificationIcon(item.type)} size={16} color="#FFFFFF" />
          </View>
          <View style={styles.notificationText}>
            <Text style={[styles.notificationTitle, { color: isDark ? '#FFFFFF' : '#4A3A75' }]}>{item.title}</Text>
            <Text style={[styles.notificationBody, { color: isDark ? '#A0A0A0' : '#7D6BA6' }]}>{item.body}</Text>
            <Text style={[styles.notificationTime, { color: isDark ? '#A0A0A0' : '#7D6BA6' }]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          {!item.read && <View style={[styles.unreadBadge, dynamicStyles.unreadBadge]} />}
          {isSelected && (
            <View style={styles.selectionIndicator}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderZoneSection = (zone, zoneNotifications) => (
    <View key={zone} style={styles.zoneSection}>
      <View style={[styles.zoneHeader, dynamicStyles.borderColor]}>
        <Text style={[styles.zoneTitle, { color: isDark ? '#FFFFFF' : '#2F2752' }]}>
          {zone}
        </Text>
        <Text style={[styles.zoneCount, { color: isDark ? '#A0A0A0' : '#7D6BA6' }]}>
          {zoneNotifications.length} {zoneNotifications.length === 1 ? 'notification' : 'notifications'}
        </Text>
      </View>
      {zoneNotifications.map(renderNotification)}
    </View>
  );

  const getNotificationIcon = (type) => {
    const iconMap = {
      'daily_question': 'sunny',
      'weekly_highlights': 'bar-chart',
      'new_category': 'add-circle',
      'reengage': 'notifications',
      'two_second_question': 'flash',
      'custom': 'information-circle'
    };
    return iconMap[type] || 'notifications';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
        <View style={[styles.headerRow, dynamicStyles.bgBackground]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#2F2752'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#3E2C6E' }]}>Notifications</Text>
        </View>

        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? '#A0A0A0' : '#7D6BA6' }]}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
      <View style={[styles.headerRow, dynamicStyles.bgBackground]}>
        <TouchableOpacity 
          style={[
            styles.backButton, 
            { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
            screenWidth < 360 && styles.backButtonSmall
          ]} 
          onPress={selectedNotifications.size > 0 ? clearSelection : onBack}
        >
          <Ionicons 
            name={selectedNotifications.size > 0 ? "close" : "arrow-back"} 
            size={screenWidth < 360 ? 18 : 20} 
            color={isDark ? '#FFFFFF' : '#2F2752'} 
          />
        </TouchableOpacity>
        
        <Text style={[
          styles.headerTitle, 
          { color: isDark ? '#FFFFFF' : '#3E2C6E' },
          screenWidth < 400 && styles.headerTitleSmall
        ]}>
          {selectedNotifications.size > 0 ? 
            `${selectedNotifications.size} Selected` : 
            'Notifications'
          }
        </Text>
        
        <View style={styles.headerRight}>
          {selectedNotifications.size > 0 ? (
            <TouchableOpacity 
              onPress={deleteSelectedNotifications} 
              style={[
                styles.deleteButton, 
                { backgroundColor: '#FF4444' },
                screenWidth < 360 && styles.deleteButtonSmall
              ]}
            >
              <Ionicons 
                name="trash" 
                size={screenWidth < 360 ? 18 : 20} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={handleClearAll} 
              style={[
                styles.clearButton,
                screenWidth < 360 && styles.clearButtonSmall
              ]}
            >
              <Ionicons 
                name="trash-outline" 
                size={screenWidth < 360 ? 16 : 18} 
                color={isDark ? '#FFFFFF' : '#7D6BA6'} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={[styles.container, dynamicStyles.bgBackground]} showsVerticalScrollIndicator={false}>
        {Object.entries(groupedNotifications).map(([zone, zoneNotifications]) => 
          renderZoneSection(zone, zoneNotifications)
        )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
    paddingTop:50
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  backButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    alignSelf: 'center',
  },
  headerTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2752',
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
  zoneSection: {
    marginBottom: 20,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  zoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F2752',
  },
  zoneCount: {
    fontSize: 12,
    color: '#7D6BA6',
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: 13,
    color: '#A0A0A0',
    marginTop: 2,
    lineHeight: 18,
  },
  clearButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#A0A0A0',
  },
  selectedNotificationCard: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  deleteButtonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  clearButtonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
});
