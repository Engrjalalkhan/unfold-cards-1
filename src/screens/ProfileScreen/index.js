import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';
import { ProgressRing } from '../../components/ProgressRing';
import { StatTile } from '../../components/StatTile';
import { SettingsList } from '../../components/SettingsList';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  DAILY_REMINDER_KEY,
  WEEKLY_HIGHLIGHTS_KEY,
  NEW_CATEGORY_ALERT_KEY,
  TOTAL_QUESTIONS
} from '../../constants/storageKeys';
import {
  scheduleDailyQuestionReminder,
  scheduleWeeklyHighlights,
  scheduleNewCategoryAlert
} from '../../services/notificationService';

const getDynamicStyles = (theme, isDark) => ({
  bgBackground: { backgroundColor: isDark ? '#000000' : theme.colors.background },
  bgSurface: { backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface },
  bgSurfaceTint: { backgroundColor: isDark ? '#2A2A2A' : theme.colors.surfaceTint },
  borderColor: { borderColor: isDark ? '#333' : theme.colors.border },
  shadowColor: { shadowColor: isDark ? '#000' : theme.colors.shadow },
  textPrimary: { color: isDark ? '#FFFFFF' : theme.colors.text },
  textMuted: { color: isDark ? '#A0A0A0' : theme.colors.textMuted },
  primaryText: { color: isDark ? '#FFFFFF' : theme.colors.primaryText },
  settingsCard: {
    backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface,
    borderColor: isDark ? '#333' : theme.colors.border,
    shadowColor: isDark ? '#000' : '#5E4B8B',
  },
  notificationsPanel: {
    backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface,
    borderColor: isDark ? '#333' : theme.colors.border,
    shadowColor: isDark ? '#000' : '#5E4B8B',
  },
  notificationItem: {
    backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface,
    borderColor: isDark ? '#333' : theme.colors.border,
  },
});

export function ProfileScreen({ profile, setProfile, favoritesCount, stats, favorites = [], onViewAllFavorites, onEnableNotifications, onSignOut, onBack }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [dailyReminder, setDailyReminder] = React.useState(false);
  const [weeklyHighlights, setWeeklyHighlights] = React.useState(false);
  const [newCategoryAlert, setNewCategoryAlert] = React.useState(false);

  // Calculate multi-zone progress with colors for all viewed zones
  const calculateOverallProgress = (stats, favoritesCount) => {
    const questionsRead = stats?.questionsRead || 0;
    const timesShared = stats?.timesShared || 0;
    const favorites = favoritesCount || 0;
    
    // Simple sum: each activity = 1 point toward progress
    const totalActivities = questionsRead + timesShared + favorites;
    
    // Zone-specific colors and progress tracking
    const zoneConfig = {
      'relationship-zone': { 
        color: '#FF6B9B', // Red/Pink
        label: 'Relationship',
        maxActivities: 30 // Lower threshold for intimate zone
      },
      'friendship-zone': { 
        color: '#4ECDC4', // Blue/Cyan  
        label: 'Friendship',
        maxActivities: 40 // Medium threshold for social zone
      },
      'family-zone': { 
        color: '#10B981', // Green
        label: 'Family',
        maxActivities: 50 // Higher threshold for family zone
      },
      'emotional-zone': { 
        color: '#8B5CF6', // Purple
        label: 'Emotional',
        maxActivities: 45 // Medium-high threshold for emotional zone
      },
      'fun-zone': { 
        color: '#F59E0B', // Amber/Yellow
        label: 'Fun',
        maxActivities: 60 // Highest threshold for fun zone
      }
    };
    
    // Get all zones the user has interacted with (from stats or default to all zones)
    const viewedZones = stats?.viewedZones || ['relationship-zone', 'friendship-zone', 'family-zone', 'emotional-zone', 'fun-zone'];
    
    // Calculate progress for each viewed zone
    const zoneProgress = viewedZones.map(zoneId => {
      const config = zoneConfig[zoneId] || { color: theme.colors.primary, label: 'Overall', maxActivities: 100 };
      const zoneActivities = Math.min(totalActivities, config.maxActivities);
      const zonePercentage = Math.min((zoneActivities / config.maxActivities) * 100, 100);
      
      return {
        zoneId,
        color: config.color,
        label: config.label,
        percentage: zonePercentage,
        activities: zoneActivities
      };
    });
    
    // Calculate overall progress (average of all zone progresses)
    const overallPercentage = zoneProgress.length > 0 
      ? Math.round(zoneProgress.reduce((sum, zone) => sum + zone.percentage, 0) / zoneProgress.length)
      : 0;
    
    return {
      zoneProgress,
      overallPercentage,
      totalActivities,
      viewedZones
    };
  };

  // Load notification settings
  React.useEffect(() => {
    (async () => {
      try {
        const daily = await AsyncStorage.getItem(DAILY_REMINDER_KEY);
        const weekly = await AsyncStorage.getItem(WEEKLY_HIGHLIGHTS_KEY);
        const category = await AsyncStorage.getItem(NEW_CATEGORY_ALERT_KEY);
        setDailyReminder(daily === 'true');
        setWeeklyHighlights(weekly === 'true');
        setNewCategoryAlert(category === 'true');
      } catch {}
    })();
  }, []);

  const handleNotificationToggle = async (key, value, scheduler) => {
    try {
      await AsyncStorage.setItem(key, String(value));
      if (value) {
        await scheduler();
      }
      if (key === DAILY_REMINDER_KEY) setDailyReminder(value);
      if (key === WEEKLY_HIGHLIGHTS_KEY) setWeeklyHighlights(value);
      if (key === NEW_CATEGORY_ALERT_KEY) setNewCategoryAlert(value);
    } catch {}
  };

  const dynamicStyles = getDynamicStyles(theme, isDark);
  const backgroundColor = isDark ? '#000000' : theme.colors.background;
  const surfaceColor = isDark ? '#1E1E1E' : theme.colors.surface;
  
  // Get current zone from stats or default to null
  const currentZone = stats?.currentZone || null;
  const progressData = calculateOverallProgress(stats, favoritesCount, currentZone);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor }]}>
      <Header title="Profile" onBack={onBack} />
      <ScrollView 
        style={{ backgroundColor }}
        contentContainerStyle={[styles.scrollContainer, { backgroundColor }]}
      >
        <View style={[styles.profileCard, { 
          backgroundColor: surfaceColor,
          borderColor: isDark ? '#333' : theme.colors.border,
          // Enhanced shadow for iOS
          shadowColor: '#7A6FA3',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
          // Shadow for Android
          elevation: 12,
        }]}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiIcon}>👤</Text>
          </View>
          <Text style={[styles.profileTitle, dynamicStyles.textPrimary]}>{profile?.name || 'Friend'}</Text>
          {/* <Text style={[styles.profileTagline, dynamicStyles.textMuted]}>Building connections one question at a time</Text> */}
        </View>

        <View style={[styles.progressSection, { 
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        }]}>
          <Text style={[styles.progressHeader, dynamicStyles.textPrimary]}>Zone Progress</Text>
          
          {/* Modern gradient progress circle */}
          <View style={styles.progressCircleContainer}>
            <View style={styles.progressCircle}>
              {/* Background ring */}
              <View style={[
                styles.backgroundRing,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                }
              ]} />
              
              {/* Multi-colored circular segments */}
              <View style={styles.circularSegmentsContainer}>
                {progressData.zoneProgress.map((zone, index) => {
                  const rotation = (index * 360) / progressData.zoneProgress.length;
                  const segmentAngle = 360 / progressData.zoneProgress.length;
                  
                  return (
                    <View
                      key={zone.zoneId}
                      style={[
                        styles.circularSegment,
                        {
                          backgroundColor: zone.color,
                          transform: [
                            { rotate: `${rotation}deg` }
                          ],
                          borderTopLeftRadius: index === 0 ? 90 : 0,
                          borderTopRightRadius: index === progressData.zoneProgress.length - 1 ? 90 : 0,
                        }
                      ]}
                    />
                  );
                })}
              </View>
              
              {/* Inner circle with gradient effect */}
              <View style={[
                styles.innerCircle,
                {
                  backgroundColor: isDark ? '#000000' : '#FFFFFF',
                }
              ]}>
                <View style={[
                  styles.gradientOverlay,
                  {
                    borderColor: isDark ? '#333' : '#F0F0F0',
                  }
                ]} />
                <View style={styles.progressTextContainer}>
                  <Text style={[styles.progressPercentage, dynamicStyles.textPrimary]}>
                    {progressData.overallPercentage}%
                  </Text>
                  <Text style={[styles.progressSubtext, dynamicStyles.textMuted]}>
                    Complete
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Zone indicators */}
            <View style={styles.zoneIndicatorsContainer}>
              {progressData.zoneProgress.map((zone, index) => (
                <View key={zone.zoneId} style={styles.zoneIndicator}>
                  <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                  <Text style={[styles.zoneName, dynamicStyles.textMuted]}>
                    {zone.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Stats summary */}
          <View style={styles.statsSummary}>
            <Text style={[styles.statsText, dynamicStyles.textPrimary]}>
              {progressData.totalActivities} Activities
            </Text>
            <Text style={[styles.statsSubtext, dynamicStyles.textMuted]}>
              {progressData.zoneProgress.length} Zones Explored
            </Text>
          </View>
        </View>

        <View style={styles.tileRow}>
          <StatTile 
            theme={theme} 
            isDark={isDark}
            icon={<Ionicons name="heart-outline" size={20} color={theme.colors.primaryText} />} 
            label="Saved" 
            value={favoritesCount ?? 0} 
          />
          <StatTile 
            theme={theme} 
            isDark={isDark}
            icon={<Ionicons name="share-social-outline" size={20} color={theme.colors.primaryText} />} 
            label="Shared" 
            value={stats?.timesShared ?? 0} 
          />
          <StatTile 
            theme={theme} 
            isDark={isDark}
            icon={<Ionicons name="flame-outline" size={20} color={theme.colors.primaryText} />} 
            label="Streak" 
            value={stats?.streakDays ?? 1} 
          />
        </View>

        <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }, dynamicStyles.textMuted]}>Profile Settings</Text>
        {showNotifications ? (
          <View style={[styles.notificationsPanel, dynamicStyles.notificationsPanel, {
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.12,
            shadowRadius: 8,
            elevation: 6,
          }]}>
            <View style={[styles.notificationHeader, dynamicStyles.borderColor]}>
              <Text style={[styles.notificationTitle, dynamicStyles.textPrimary]}>Notification Settings</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Text style={[styles.closeButton, dynamicStyles.textMuted]}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.notificationItem, dynamicStyles.notificationItem]}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationLabel, dynamicStyles.textPrimary]}>Daily Question Reminder</Text>
                <Text style={[styles.notificationDesc, dynamicStyles.textMuted]}>Get a daily reminder to explore questions</Text>
              </View>
              <Switch
                value={dailyReminder}
                onValueChange={(v) => handleNotificationToggle(DAILY_REMINDER_KEY, v, scheduleDailyQuestionReminder)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : theme.colors.primaryText}
              />
            </View>
            <View style={[styles.notificationItem, dynamicStyles.notificationItem]}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationLabel, dynamicStyles.textPrimary]}>Weekly Highlights</Text>
                <Text style={[styles.notificationDesc, dynamicStyles.textMuted]}>Weekly summary of your progress</Text>
              </View>
              <Switch
                value={weeklyHighlights}
                onValueChange={(v) => handleNotificationToggle(WEEKLY_HIGHLIGHTS_KEY, v, scheduleWeeklyHighlights)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : theme.colors.primaryText}
              />
            </View>
            <View style={[styles.notificationItem, dynamicStyles.notificationItem]}>
              <View style={styles.notificationInfo}>
                <Text style={[styles.notificationLabel, dynamicStyles.textPrimary]}>New Category Alerts</Text>
                <Text style={[styles.notificationDesc, dynamicStyles.textMuted]}>Be notified about new question categories</Text>
              </View>
              <Switch
                value={newCategoryAlert}
                onValueChange={(v) => handleNotificationToggle(NEW_CATEGORY_ALERT_KEY, v, scheduleNewCategoryAlert)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : theme.colors.primaryText}
              />
            </View>
          </View>
        ) : (
          <SettingsList
            onEditProfile={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
            onEnableNotifications={() => setShowNotifications(true)}
            onSignOut={onSignOut}
            theme={theme}
            isDark={isDark}
          />
        )}

        <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }, dynamicStyles.textMuted]}>App Settings</Text>
        <View style={[styles.settingsCard, dynamicStyles.settingsCard, {
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.12,
            shadowRadius: 8,
            elevation: 6,
          }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, dynamicStyles.textPrimary]}>Dark Mode</Text>
              <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>Toggle dark theme</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={Platform.OS === 'ios' ? undefined : theme.colors.primaryText}
            />
          </View>
        </View>

        {favorites.length > 0 && (
          <View style={styles.favoritesSection}>
            <TouchableOpacity 
              style={[styles.viewAllButton, dynamicStyles.bgSurfaceTint, {
                // Enhanced shadow for iOS
                shadowColor: '#5E4B8B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                // Shadow for Android
                elevation: 6,
              }]} 
              onPress={onViewAllFavorites}
            >
              <Text style={[styles.viewAllText, dynamicStyles.primaryText]}>View All Favorites ({favorites.length})</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.primaryText} />
            </TouchableOpacity>
          </View>
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  profileCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    shadowColor: '#7A6FA3',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  emojiCircle: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: '#E6D6FF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    shadowColor: '#7A6FA3',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  emojiIcon: { fontSize: 40 },
  profileTitle: { color: '#6B3AA0', fontSize: 28, fontWeight: '800', marginTop: 12 },
  profileTagline: { color: '#8B6FB1', fontSize: 14, marginTop: 6 },
  progressSection: { 
    alignItems: 'center', 
    paddingTop: 12, 
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  progressHeader: { color: '#5A3785', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  progressCircleContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  progressCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  backgroundRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 90,
    overflow: 'hidden',
  },
  circularSegmentsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 90,
    overflow: 'hidden',
  },
  circularSegment: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    left: '50%',
    top: 0,
    transformOrigin: 'left bottom',
    opacity: 0.9,
  },
  multiColorRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 90,
    overflow: 'hidden',
  },
  colorRing: {
    position: 'absolute',
    width: '100%',
    height: 20,
    top: '50%',
    marginTop: -10,
    left: 0,
    transformOrigin: 'center',
    borderRadius: 10,
  },
  progressSegment: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    left: '50%',
    top: 0,
    transformOrigin: 'left bottom',
    borderRadius: 90,
    opacity: 0.9,
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  progressTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#5A3785',
    lineHeight: 36,
  },
  progressSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8B6FB1',
    marginTop: 2,
  },
  zoneIndicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
    paddingHorizontal: 20,
  },
  zoneIndicator: {
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  zoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  zoneName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  statsSummary: {
    alignItems: 'center',
    marginTop: 16,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A3785',
    marginBottom: 4,
  },
  statsSubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B6FB1',
  },
  tileRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 12 },
  statTileIconI: { marginRight: 8 },
  sectionTitle: {
    color: '#8B6FB1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  notificationsPanel: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 18, 
    borderWidth: 1, 
    borderColor: '#E6D6FF', 
    shadowColor: 'rgba(90, 60, 180, 0.25)',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    marginBottom: 16, 
    padding: 20, 
    elevation: 8,
    overflow: 'hidden'
  },
  notificationHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16, 
    paddingBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E6D6FF' 
  },
  notificationTitle: { color: '#5A3785', fontSize: 18, fontWeight: '700' },
  closeButton: { color: '#7A6FA3', fontSize: 20 },
  notificationItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0E5FF',
    backgroundColor: '#FFFFFF'
  },
  notificationInfo: { flex: 1, marginRight: 16 },
  notificationLabel: { color: '#5A3785', fontSize: 16, fontWeight: '600' },
  notificationDesc: { color: '#7A6FA3', fontSize: 13, marginTop: 2 },
  settingsCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6D6FF', shadowColor: 'rgba(157,78,221,0.25)', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, marginBottom: 12, elevation: 3 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12 },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { color: '#5A3785', fontSize: 16, fontWeight: '600' },
  settingDesc: { color: '#7A6FA3', fontSize: 13, marginTop: 2 },
  favoritesSection: { marginTop: 8, marginBottom: 20 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  viewAllText: { color: '#5A3785', fontSize: 16, fontWeight: '600', marginRight: 8 },
});
