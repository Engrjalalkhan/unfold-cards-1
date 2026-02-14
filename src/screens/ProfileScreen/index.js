import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Platform, Modal, Dimensions, ActionSheetIOS, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../navigation/Header';
import { ProgressRing } from '../../components/ProgressRing';
import { StatTile } from '../../components/StatTile';
import { SettingsList } from '../../components/SettingsList';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  FAVORITES_STORAGE_KEY, 
  PROFILE_STORAGE_KEY, 
  DAILY_REMINDER_KEY, 
  WEEKLY_HIGHLIGHTS_KEY, 
  NEW_CATEGORY_ALERT_KEY
} from '../../constants/storageKeys';
import {
  scheduleDailyQuestionReminder,
  scheduleWeeklyHighlights,
  scheduleNewCategoryAlert,
  enableDailyRemindersWithFirebase,
  enableWeeklyHighlightsWithFirebase,
  enableNewCategoryAlertsWithFirebase,
  subscribeToTopic,
  unsubscribeFromTopic
} from '../../services/notificationService';

const { width: screenWidth } = Dimensions.get('window');

// Avatar options
const AVATAR_OPTIONS = [
  '👤', '👨', '👩', '🧑', '👶', '👴', '👵', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱',
  '👨‍🦳', '👩‍🦳', '👨‍🦲', '👩‍🦲', '🦸', '🦸‍♀️', '🦹', '🦹‍♀️', '🧙', '🧙‍♀️',
  '🧚', '🧚‍♀️', '🧛', '🧛‍♀️', '🧜', '🧜‍♀️', '🧞', '🧞‍♀️', '🧟', '🧟‍♀️',
  '🤖', '👽', '🎭', '🤡', '🦄', '🦋', '🐶', '🐱', '🐭', '🐹', '🐰',
  '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
  '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴',
  '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️'
];

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

export function ProfileScreen({ profile, setProfile, favoritesCount, stats, favorites = [], onViewAllFavorites, onEnableNotifications, onSignOut, onBack, onNavigateToDarkMode }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [dailyReminder, setDailyReminder] = React.useState(false);
  const [weeklyHighlights, setWeeklyHighlights] = React.useState(false);
  const [newCategoryAlert, setNewCategoryAlert] = React.useState(false);
  const [showAvatarModal, setShowAvatarModal] = React.useState(false);
  const [selectedAvatar, setSelectedAvatar] = React.useState('👤');
  const [profileImage, setProfileImage] = React.useState(null);
  const [showEditProfileModal, setShowEditProfileModal] = React.useState(false);
  const [editProfile, setEditProfile] = React.useState({
    name: '',
    gender: '',
    bio: '',
    location: '',
    age: ''
  });

  // Load avatar and profile image from storage on mount
  React.useEffect(() => {
    (async () => {
      try {
        const savedAvatar = await AsyncStorage.getItem('USER_AVATAR');
        const savedProfileImage = await AsyncStorage.getItem('PROFILE_IMAGE');
        const savedProfileData = await AsyncStorage.getItem('USER_PROFILE_DATA');
        
        if (savedAvatar) {
          setSelectedAvatar(savedAvatar);
        }
        if (savedProfileImage) {
          setProfileImage(savedProfileImage);
        }
        if (savedProfileData) {
          const profileData = JSON.parse(savedProfileData);
          setEditProfile(profileData);
        } else {
          // Initialize with current profile data
          setEditProfile({
            name: profile?.name || 'Friend',
            gender: profile?.gender || '',
            bio: profile?.bio || '',
            location: profile?.location || '',
            age: profile?.age || ''
          });
        }
      } catch (error) {
        console.log('Error loading profile data:', error);
      }
    })();
  }, [profile]);

  // Save profile data
  const saveProfileData = async (profileData) => {
    try {
      await AsyncStorage.setItem('USER_PROFILE_DATA', JSON.stringify(profileData));
      setEditProfile(profileData);
      // Update the profile prop if setProfile function is provided
      if (setProfile) {
        setProfile(profileData);
      }
    } catch (error) {
      console.log('Error saving profile data:', error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = () => {
    console.log('=== PROFILE UPDATE DEBUG ===');
    console.log('Current editProfile.name:', editProfile.name);
    
    if (!editProfile.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    saveProfileData(editProfile);
    setShowEditProfileModal(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };
  const saveAvatar = async (avatar) => {
    try {
      await AsyncStorage.setItem('USER_AVATAR', avatar);
      setSelectedAvatar(avatar);
      // Clear profile image when emoji avatar is selected
      await AsyncStorage.removeItem('PROFILE_IMAGE');
      setProfileImage(null);
    } catch (error) {
      console.log('Error saving avatar:', error);
    }
  };

  // Handle gallery image selection
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to select an image.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await AsyncStorage.setItem('PROFILE_IMAGE', imageUri);
        setProfileImage(imageUri);
        // Clear emoji avatar when gallery image is selected
        await AsyncStorage.removeItem('USER_AVATAR');
        setSelectedAvatar('👤');
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image from gallery.');
    }
  };

  // Show options when user icon is clicked
  const handleProfileIconPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Select Avatar', 'Select from Gallery'],
          cancelButtonIndex: 0,
          userInterfaceStyle: isDark ? 'dark' : 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setShowAvatarModal(true);
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      // For Android, show a simple alert with options
      Alert.alert(
        'Profile Picture',
        'Choose an option for your profile picture',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Select Avatar', onPress: () => setShowAvatarModal(true) },
          { text: 'Select from Gallery', onPress: () => pickImage() },
        ],
        { cancelable: true }
      );
    }
  };

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

  // Enhanced Firebase notification handlers
  const handleDailyReminderToggle = async (value) => {
    setDailyReminder(value);
    
    if (value) {
      const success = await enableDailyRemindersWithFirebase();
      if (!success) {
        setDailyReminder(false); // Revert on failure
      }
    } else {
      await unsubscribeFromTopic('daily_reminders');
      await AsyncStorage.setItem(DAILY_REMINDER_KEY, 'false');
    }
  };

  const handleWeeklyHighlightToggle = async (value) => {
    setWeeklyHighlights(value);
    
    if (value) {
      const success = await enableWeeklyHighlightsWithFirebase();
      if (!success) {
        setWeeklyHighlights(false); // Revert on failure
      }
    } else {
      await unsubscribeFromTopic('weekly_highlights');
      await AsyncStorage.setItem(WEEKLY_HIGHLIGHTS_KEY, 'false');
    }
  };

  const handleNewCategoryAlertToggle = async (value) => {
    setNewCategoryAlert(value);
    
    if (value) {
      const success = await enableNewCategoryAlertsWithFirebase();
      if (!success) {
        setNewCategoryAlert(false); // Revert on failure
      }
    } else {
      await unsubscribeFromTopic('new_category_alerts');
    }
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
          <TouchableOpacity 
            style={styles.emojiCircle}
            onPress={handleProfileIconPress}
            activeOpacity={0.7}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Text style={styles.emojiIcon}>{selectedAvatar}</Text>
            )}
            <View style={styles.editIconOverlay}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.profileTitle, dynamicStyles.textPrimary]}>{editProfile.name || 'Friend'}</Text>
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
                onValueChange={handleDailyReminderToggle}
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
                onValueChange={handleWeeklyHighlightToggle}
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
                onValueChange={handleNewCategoryAlertToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : theme.colors.primaryText}
              />
            </View>
          </View>
        ) : (
          <SettingsList
            onEditProfile={() => setShowEditProfileModal(true)}
            onEnableNotifications={() => setShowNotifications(true)}
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
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={onNavigateToDarkMode}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, dynamicStyles.textPrimary]}>Dark Mode</Text>
              <Text style={[styles.settingDesc, dynamicStyles.textMuted]}>Toggle dark theme</Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={isDark ? '#A0A0A0' : theme.colors.textMuted} 
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
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

        {/* Avatar Selection Modal */}
        <Modal
          visible={showAvatarModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAvatarModal(false)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#333' : '#E6D6FF' }]}>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#5A3785'} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, dynamicStyles.textPrimary]}>Choose Avatar</Text>
              <View style={styles.modalSpacer} />
            </View>
            
            <ScrollView 
              style={styles.avatarScroll}
              contentContainerStyle={styles.avatarGrid}
              showsVerticalScrollIndicator={false}
            >
              {AVATAR_OPTIONS.map((avatar, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.avatarItem,
                    { 
                      backgroundColor: isDark ? '#1E1E1E' : '#F8F8F8',
                      borderColor: selectedAvatar === avatar ? theme.colors.primary : (isDark ? '#333' : '#E6D6FF'),
                      borderWidth: selectedAvatar === avatar ? 2 : 1
                    }
                  ]}
                  onPress={() => {
                    saveAvatar(avatar);
                    setShowAvatarModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarEmoji}>{avatar}</Text>
                  {selectedAvatar === avatar && (
                    <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                      <Ionicons name="check" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal
          visible={showEditProfileModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditProfileModal(false)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#333' : '#E6D6FF' }]}>
              <TouchableOpacity onPress={() => setShowEditProfileModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={isDark ? '#FFFFFF' : '#5A3785'} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, dynamicStyles.textPrimary]}>Edit Profile</Text>
              <TouchableOpacity onPress={handleProfileUpdate} style={styles.modalSaveButton}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.profileScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.profileForm}>
                {/* Profile Picture Section */}
                <View style={styles.profilePictureSection}>
                  <TouchableOpacity 
                    style={[
                      styles.profilePictureButton,
                      { 
                        backgroundColor: isDark ? '#1E1E1E' : '#F8F8F8',
                        borderColor: isDark ? '#333' : '#E6D6FF'
                      }
                    ]}
                    onPress={handleProfileIconPress}
                    activeOpacity={0.7}
                  >
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.modalProfileImage} />
                    ) : (
                      <Text style={styles.modalEmojiIcon}>{selectedAvatar}</Text>
                    )}
                    <View style={styles.modalEditIconOverlay}>
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.profilePictureText, dynamicStyles.textMuted]}>Tap to change profile picture</Text>
                </View>

                {/* Name Input */}
                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, dynamicStyles.textPrimary]}>Name *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      dynamicStyles.bgSurface,
                      dynamicStyles.borderColor,
                      dynamicStyles.textPrimary
                    ]}
                    value={editProfile.name}
                    onChangeText={(text) => setEditProfile(prev => ({ ...prev, name: text }))}
                    placeholder="Enter your name"
                    placeholderTextColor={isDark ? '#A0A0A0' : '#999'}
                    maxLength={50}
                  />
                </View>

                {/* Gender Selection */}
                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, dynamicStyles.textPrimary]}>Gender</Text>
                  <View style={styles.genderOptions}>
                    {['Male', 'Female', 'Other', 'Prefer not to say'].map((gender) => (
                      <TouchableOpacity
                        key={gender}
                        style={[
                          styles.genderOption,
                          { 
                            backgroundColor: editProfile.gender === gender ? theme.colors.primary : (isDark ? '#1E1E1E' : '#F8F8F8'),
                            borderColor: editProfile.gender === gender ? theme.colors.primary : (isDark ? '#333' : '#E6D6FF')
                          }
                        ]}
                        onPress={() => setEditProfile(prev => ({ ...prev, gender }))}
                      >
                        <Text style={[
                          styles.genderText,
                          { color: editProfile.gender === gender ? '#FFFFFF' : (isDark ? '#A0A0A0' : '#666') }
                        ]}>{gender}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Age Input */}
                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, dynamicStyles.textPrimary]}>Age</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      dynamicStyles.bgSurface,
                      dynamicStyles.borderColor,
                      dynamicStyles.textPrimary
                    ]}
                    value={editProfile.age}
                    onChangeText={(text) => setEditProfile(prev => ({ ...prev, age: text }))}
                    placeholder="Enter your age"
                    placeholderTextColor={isDark ? '#A0A0A0' : '#999'}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>

                {/* Location Input */}
                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, dynamicStyles.textPrimary]}>Location</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      dynamicStyles.bgSurface,
                      dynamicStyles.borderColor,
                      dynamicStyles.textPrimary
                    ]}
                    value={editProfile.location}
                    onChangeText={(text) => setEditProfile(prev => ({ ...prev, location: text }))}
                    placeholder="Enter your location"
                    placeholderTextColor={isDark ? '#A0A0A0' : '#999'}
                    maxLength={100}
                  />
                </View>

                {/* Bio Input */}
                <View style={styles.inputSection}>
                  <Text style={[styles.inputLabel, dynamicStyles.textPrimary]}>Bio</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.bioInput,
                      dynamicStyles.bgSurface,
                      dynamicStyles.borderColor,
                      dynamicStyles.textPrimary
                    ]}
                    value={editProfile.bio}
                    onChangeText={(text) => setEditProfile(prev => ({ ...prev, bio: text }))}
                    placeholder="Tell us about yourself..."
                    placeholderTextColor={isDark ? '#A0A0A0' : '#999'}
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
    position: 'relative',
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#5E4B8B',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  emojiIcon: { 
    fontSize: 85,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 85,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
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
  // Test Button Styles
  testButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6D6FF', shadowColor: 'rgba(157,78,221,0.25)', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, marginBottom: 12, elevation: 3 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12 },
  settingInfo: { flex: 1, marginRight: 16 },
  settingRight: { flexDirection: 'row', alignItems: 'center' },
  chevronIcon: { marginLeft: 8 },
  settingLabel: { color: '#5A3785', fontSize: 16, fontWeight: '600' },
  settingDesc: { color: '#7A6FA3', fontSize: 13, marginTop: 2 },
  favoritesSection: { marginTop: 8, marginBottom: 20 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12 },
  viewAllText: { color: '#5A3785', fontSize: 16, fontWeight: '600', marginRight: 8 },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5A3785',
  },
  modalSpacer: {
    width: 40,
  },
  avatarScroll: {
    flex: 1,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  avatarItem: {
    width: (screenWidth - 64) / 6,
    height: (screenWidth - 64) / 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 28,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Edit Profile Modal styles
  profileScroll: {
    flex: 1,
  },
  profileForm: {
    padding: 16,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePictureButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: '#E6D6FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalProfileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  modalEmojiIcon: {
    fontSize: 70,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 70,
  },
  modalEditIconOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#5E4B8B',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  profilePictureText: {
    fontSize: 12,
    color: '#8B6FB1',
    marginTop: 8,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5A3785',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#E6D6FF',
    color: '#2F2752',
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    backgroundColor: '#FFFFFF',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  modalSaveButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    backgroundColor: '#FFFFFF',
  },
  genmodalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
