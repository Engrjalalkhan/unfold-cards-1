import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ScrollView, LayoutAnimation, Platform, UIManager, Animated, Easing, Dimensions, TextInput, Share, PanResponder, Alert, AppState, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { zones } from './data/decks';
import { lightTheme, darkTheme } from './theme';
import { allCategories } from './data/decks';

const FAVORITES_STORAGE_KEY = '@unflod_cards:favorites:v1';
const PROFILE_STORAGE_KEY = '@unflod_cards:profile:v1';
const STATS_STORAGE_KEY = '@unflod_cards:stats:v1';
const NOTIF_ENABLED_KEY = '@unflod_cards:notif_enabled:v1';
const LAST_ACTIVE_TS_KEY = '@unflod_cards:last_active_ts:v1';
const REENGAGE_ID_KEY = '@unflod_cards:reengage_id:v1';
const DAILY_REMINDER_KEY = '@unflod_cards:daily_reminder_enabled:v1';
const WEEKLY_HIGHLIGHTS_KEY = '@unflod_cards:weekly_highlights_enabled:v1';
const NEW_CATEGORY_ALERT_KEY = '@unflod_cards:new_category_alert_enabled:v1';
const DARK_MODE_KEY = '@unflod_cards:dark_mode_enabled:v1';

const TOTAL_QUESTIONS = 600;

// Utilities
const hexToRgba = (hex, alpha = 1) => {
  try {
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      let c = hex.substring(1).split('');
      if (c.length === 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      c = '0x' + c.join('');
      // eslint-disable-next-line no-bitwise
      return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',')},${alpha})`;
    }
  } catch (e) {}
  return hex;
};

// Helper to get a YYYY-MM-DD date key
const getDateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// Cross-platform sharing helper
const shareQuestionText = async (text) => {
  try {
    if (Platform.OS === 'web') {
      // Prefer native Web Share API when available
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text, title: 'Unfold Cards' });
        return true;
      }
      // Fallback: copy to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Copied to clipboard. Share it anywhere!');
        } else {
          Alert.alert('Copied to clipboard', 'Question text copied. Share it anywhere!');
        }
        return true;
      }
      Alert.alert('Sharing unavailable', 'Please copy the text manually to share.');
      return false;
    }
    const result = await Share.share({ message: text });
    return result?.action === Share.sharedAction;
  } catch (e) {
    // Last fallback for web: attempt clipboard copy
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        if (typeof window !== 'undefined' && window.alert) {
          window.alert('Copied to clipboard.');
        } else {
          Alert.alert('Copied to clipboard', 'Question text copied.');
        }
        return true;
      } catch {}
    }
    Alert.alert('Share error', 'Unable to share right now.');
    return false;
  }
};

// Notifications handler: show alerts, no sound/badge by default
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const pickSuggestionBody = () => {
  try {
    if (Array.isArray(allCategories) && allCategories.length > 0) {
      const c = allCategories[Math.floor(Math.random() * allCategories.length)];
      const name = c?.name || 'a category';
      return `Take a moment today — try a card from ${name}.`;
    }
  } catch {}
  return 'Take a mindful minute — open Unflod Cards today.';
};

const scheduleReengageReminder = async () => {
  try {
    if (Platform.OS === 'web') return null;
    // Cancel any existing re-engage reminder
    const existingId = await AsyncStorage.getItem(REENGAGE_ID_KEY);
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Keep the connection going',
        body: pickSuggestionBody(),
        data: { type: 'reengage' },
      },
      trigger: { hour: 19, minute: 0, repeats: true },
    });
    await AsyncStorage.setItem(REENGAGE_ID_KEY, id);
    return id;
  } catch {}
  return null;
};

const enableDailyReminders = async () => {
  try {
    if (Platform.OS === 'web') {
      Alert.alert('Notifications on Web', 'Notifications are not available in this web preview. Use a device build to receive reminders.');
      return false;
    }
    const current = await Notifications.getPermissionsAsync();
    let status = current?.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req?.status;
    }
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Enable notifications in system settings to receive reminders.');
      await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'false');
      return false;
    }
    await AsyncStorage.setItem(NOTIF_ENABLED_KEY, 'true');
    await scheduleReengageReminder();
    Alert.alert('Reminders enabled', 'We’ll nudge you if you’re away for a day.');
    return true;
  } catch (e) {
    Alert.alert('Notifications error', 'Something went wrong enabling reminders.');
    return false;
  }
};

const scheduleWeeklyHighlights = async () => {
  try {
    if (Platform.OS === 'web') return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly Highlights',
        body: 'Catch up on your favorite moments from this week. Tap to explore!',
        data: { type: 'weekly_highlights' },
      },
      trigger: { weekday: 1, hour: 10, minute: 0, repeats: true }, // Monday at 10 AM
    });
    return id;
  } catch {}
  return null;
};

const scheduleNewCategoryAlert = async () => {
  try {
    if (Platform.OS === 'web') return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Category Available!',
        body: 'A fresh card category has been added. Discover new ways to connect!',
        data: { type: 'new_category' },
      },
      trigger: { hour: 12, minute: 0, repeats: false }, // One-time notification at noon
    });
    return id;
  } catch {}
  return null;
};

const scheduleDailyQuestionReminder = async () => {
  try {
    if (Platform.OS === 'web') return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Question',
        body: 'Your daily question is ready! Take a moment to reflect and connect.',
        data: { type: 'daily_question' },
      },
      trigger: { hour: 9, minute: 0, repeats: true }, // Daily at 9 AM
    });
    return id;
  } catch {}
  return null;
};



function Header({ title, onBack, right, theme }) {
  const dynamicStyles = getDynamicStyles(theme);
  return (
    <View style={[styles.header, dynamicStyles.bgSurface]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={[styles.backButton, dynamicStyles.bgSurfaceTint]}>
          <Text style={[styles.backText, dynamicStyles.textPrimary]}>‹ Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 64 }} />
      )}
      <Text style={[styles.headerTitle, dynamicStyles.textPrimary]}>{title}</Text>
      {right ? right : <View style={{ width: 64 }} />}
    </View>
  );
}

function BrandHeader({ theme }) {
  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandLogoWrap}>
        <HeartbeatGlow size={60} />
        <Text style={[styles.brandIcon, { position: 'relative' }]}>💜</Text>
      </View>
      <Text style={styles.brandTitle}>Unfold Cards</Text>
      <Text style={styles.brandTagline}>Build meaningful connections</Text>
    </View>
  );
}

// Small reusable UI primitives to match design
const StatTile = React.memo(function StatTile({ icon, label, value, suffix, theme }) {
  const dynamicStyles = getDynamicStyles(theme);
  return (
    <View style={styles.statTile}>
      <View style={styles.statTileHeader}>
        <Text style={styles.statTileIcon}>{icon}</Text>
        <Text style={[styles.statTileLabel, dynamicStyles.textPrimary]}>{label}</Text>
      </View>
      <Text style={[styles.statTileValue, dynamicStyles.textPrimary]}>
        {value}{suffix ? ` ${suffix}` : ''}
      </Text>
    </View>
  );
});

// Visual circular progress arc without external dependencies
function ProgressRing({ size = 200, thickness = 14, progress = 0, trackColor, progressColor, children, animatedProgress, theme }) {
  const clamped = Math.max(0, Math.min(1, progress || 0));
  const internalAnim = React.useRef(new Animated.Value(clamped)).current;
  const anim = animatedProgress || internalAnim;

  React.useEffect(() => {
    if (!animatedProgress) {
      Animated.timing(internalAnim, {
        toValue: clamped,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [clamped, animatedProgress]);

  const rightRotate = anim.interpolate({
    inputRange: [0, 0.5],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });
  const leftRotate = anim.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });
  const leftOpacity = anim.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: [0, 0, 1, 1],
  });

  const half = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Track ring behind */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: trackColor }} />
      {/* Right half progress */}
      <View style={{ position: 'absolute', left: half, top: 0, width: half, height: size, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', left: -half, top: 0, width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: progressColor, transform: [{ rotate: '-90deg' }, { rotate: rightRotate }] }} />
      </View>
      {/* Left half progress */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: half, height: size, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: progressColor, opacity: leftOpacity, transform: [{ rotate: '-90deg' }, { rotate: leftRotate }] }} />
      </View>

      <View style={styles.progressRingContent}>{children}</View>
    </View>
  );
}

// Soft heartbeat-style glow behind logo using layered circles
function HeartbeatGlow({ size = 60, duration = 2000 }) {
  const progress = React.useRef(new Animated.Value(0)).current;
  const base = size; // square container
  const spread = 40; // total diameter increase to simulate 20px around radius
  const scaleTo = (base + spread) / base;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      })
    ).start();
  }, [duration]);

  const layer = (color, baseOpacity, extraScale = 0) => ({
    backgroundColor: color,
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [baseOpacity, 0] }),
    transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1 + extraScale, scaleTo + extraScale] }) }],
  });

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: base, height: base }} pointerEvents="none">
      <Animated.View style={[styles.glowCircle, { width: base, height: base, borderRadius: base / 2 }, layer('#8A4DFF', 1.0, 0)]} />
      <Animated.View style={[styles.glowCircle, { width: base, height: base, borderRadius: base / 2 }, layer('#A26BFF', 0.6, 0.05)]} />
      <Animated.View style={[styles.glowCircle, { width: base, height: base, borderRadius: base / 2 }, layer('#C295FF', 0.3, 0.10)]} />
    </View>
  );
}

 

const HighlightCard = React.memo(function HighlightCard({ icon, title, subtitle }) {
  return (
    <View style={styles.highlightCard}>
      <View style={styles.highlightIconWrap}><Text style={styles.highlightIcon}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.highlightTitle}>{title}</Text>
        <Text style={styles.highlightSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </View>
  );
});

const SettingsList = React.memo(function SettingsList({ onEditProfile, onEnableNotifications, onSignOut, theme }) {
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

function Particle({ seed }) {
  const { size, startX, startY, driftX, driftY, duration, color, baseOpacity } = seed;
  const x = React.useRef(new Animated.Value(startX)).current;
  const y = React.useRef(new Animated.Value(startY)).current;
  const opacity = React.useRef(new Animated.Value(baseOpacity)).current;
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(x, { toValue: startX + driftX, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(y, { toValue: startY + driftY, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: baseOpacity + 0.25, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.08, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(x, { toValue: startX - driftX, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(y, { toValue: startY - driftY, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: baseOpacity, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [x, y, opacity, scale, startX, startY, driftX, driftY, duration, baseOpacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateX: x }, { translateY: y }, { scale }],
        opacity,
        shadowColor: '#CBB2FF',
        shadowOpacity: 0.6,
        shadowRadius: 16,
      }}
    />
  );
}

function SoftParticles({ theme }) {
  const { width, height } = Dimensions.get('window');
  const palette = theme?.name === 'dark'
    ? ['rgba(157,78,221,0.12)', 'rgba(201,179,255,0.10)', 'rgba(233,215,255,0.08)']
    : ['rgba(157,78,221,0.15)', 'rgba(201,179,255,0.12)', 'rgba(233,215,255,0.10)'];
  const seeds = React.useMemo(() => {
    const n = 14;
    return Array.from({ length: n }).map(() => {
      const size = 10 + Math.floor(Math.random() * 16); // 10–26px
      const startX = Math.random() * width;
      const startY = Math.random() * (height * 0.8);
      const driftX = 12 + Math.random() * 24;
      const driftY = 10 + Math.random() * 22;
      const duration = 4000 + Math.floor(Math.random() * 3000);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const baseOpacity = 0.18 + Math.random() * 0.18; // 0.18–0.36
      return { size, startX, startY, driftX, driftY, duration, color, baseOpacity };
    });
  }, [width, height]);

  return (
    <View pointerEvents="none" style={styles.particlesLayer}>
      {seeds.map((seed, i) => (
        <Particle key={i} seed={seed} />
      ))}
    </View>
  );
}

function OnboardingScreen({ onContinue, theme }) {
  const pulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const floating = [
    { emoji: '💜', style: { top: 120, left: 24 } },
    { emoji: '⭐', style: { top: 220, right: 32 } },
    { emoji: '💬', style: { top: 320, left: 48 } },
  ];

  return (
    <LinearGradient colors={theme.gradients.onboarding} style={styles.onboardingContainer}>
      <SoftParticles theme={theme} />
      <View style={styles.onboardingContent}>
        <Text style={styles.onboardingIcon}>💬</Text>
        <Text style={styles.onboardingTitle}>Unfold Cards</Text>
        <Text style={styles.onboardingTagline}>Unfold deeper connections.</Text>

        {floating.map((f, i) => (
          <Text key={i} style={[styles.floatingIcon, f.style]}>{f.emoji}</Text>
        ))}

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity onPress={onContinue} activeOpacity={0.9} style={styles.ctaButton}>
            <LinearGradient colors={theme.gradients.cta} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
              <Text style={styles.ctaText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        <TouchableOpacity onPress={onContinue} style={styles.guestLinkBtn}>
          <Text style={styles.guestLink}>Continue as Guest</Text>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
}

 

 

 

function MoodMeter({ onSelect, theme }) {
  const options = [
    { id: 'excited', emoji: '🤩', label: 'Excited' },
    { id: 'happy', emoji: '😀', label: 'Happy' },
    { id: 'calm', emoji: '🙂', label: 'Calm' },
    { id: 'neutral', emoji: '😐', label: 'Neutral' },
    { id: 'sad', emoji: '😔', label: 'Sad' },
    { id: 'angry', emoji: '😡', label: 'Angry' },
    { id: 'tired', emoji: '😴', label: 'Tired' },
    { id: 'overwhelmed', emoji: '😭', label: 'Overwhelmed' },
  ];

  return (
    <View style={styles.moodOverlay}>
      <View style={styles.moodCard}>
        <Text style={styles.moodTitle}>How are you feeling today?</Text>
        <Text style={styles.moodSubtitle}>Select one to set your vibe</Text>
        <View style={styles.moodGrid}>
          {options.map((o) => (
            <TouchableOpacity key={o.id} style={styles.moodItem} onPress={() => onSelect(o)}>
              <Text style={styles.moodEmoji}>{o.emoji}</Text>
              <Text style={styles.moodLabel}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.moodHint}>You can change this anytime from the home screen later.</Text>
      </View>
    </View>
  );
}

function CategoryCard({ category, onPress, theme }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  const tint = hexToRgba(category.color || theme.colors.primary, 0.10);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={[styles.categoryCard, { borderColor: category.color || theme.colors.border }]}
      >
        <LinearGradient
          style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
          colors={[tint, '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.deckBadge, { backgroundColor: category.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.deckTitle}>{category.name}</Text>
          <Text style={styles.deckSubtitle}>{category.questions.length} questions</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ZoneSection({ zone, onSelectCategory, theme }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.sectionTitle, { color: zone.color }]}>{zone.name}</Text>
      {/* Placeholder; actual accordion handled in HomeScreen to control single expansion */}
    </View>
  );
}

function DailyQuestion({ onAnswer, theme }) {
  // Deterministic daily pick across mixed categories using date key
  const key = getDateKey(); // YYYY-MM-DD
  const numericSeed = key
    .replace(/-/g, '')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const categoryIndex = numericSeed % allCategories.length;
  const category = allCategories[categoryIndex];
  const questionIndex = numericSeed % category.questions.length;
  const question = category.questions[questionIndex];

  return (
    <View style={styles.dailyCard}>
      <Text style={styles.dailyTitle}>Question of the Day 💭</Text>
      <Text style={styles.dailyPrompt}>{question}</Text>
      {/* Removed CTA per request; daily question updates automatically each day */}
    </View>
  );
}

function HomeScreen({ onSelectCategory, onAnswerDaily, profile, stats, theme }) {
  const [expandedZoneId, setExpandedZoneId] = React.useState(null);
  const [todayKey, setTodayKey] = React.useState(getDateKey());
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  React.useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const ms = next - now;
    const t = setTimeout(() => setTodayKey(getDateKey()), ms);
    return () => clearTimeout(t);
  }, [todayKey]);

  const toggleZone = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedZoneId((prev) => (prev === id ? null : id));
  };

  const dynamicStyles = getDynamicStyles(theme);
  return (
    <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
      <View style={[styles.brandHeader, dynamicStyles.bgBackground]}>
        <Text style={[styles.heroTitle, dynamicStyles.textPrimary]}>Hi, {profile?.name || 'Friend'}!</Text>
        <Text style={[styles.streakLabel, dynamicStyles.textMuted]}>🔥 Connection Streak: {stats?.streakDays ?? 1} Days</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}>
        <View style={[styles.panel, { marginTop: 4 }]}>
          <DailyQuestion key={todayKey} onAnswer={onAnswerDaily} theme={theme} />
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search topics"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, dynamicStyles.bgSurfaceTint, dynamicStyles.borderColor, { color: theme.colors.text }]}
          />
        </View>

        <Text style={[styles.sectionTitle, dynamicStyles.textMuted]}>Explore Zones</Text>

        {(function() {
          const q = query.trim().toLowerCase();
          const displayed = zones.map((zone) => ({
            ...zone,
            categories: q
              ? zone.categories.filter((c) =>
                  (c.name || '').toLowerCase().includes(q) || (zone.name || '').toLowerCase().includes(q)
                )
              : zone.categories,
          })).filter((z) => z.categories && z.categories.length > 0);
          return displayed;
        })().map((zone) => {
          const expanded = expandedZoneId === zone.id;
          return (
            <View key={zone.id} style={[styles.zoneCard, dynamicStyles.bgSurface, dynamicStyles.borderColor, dynamicStyles.shadowColor]}>
              <LinearGradient
                style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
                colors={[theme.colors.surface, theme.colors.surfaceTint]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <TouchableOpacity activeOpacity={0.85} style={styles.zoneHeaderRow} onPress={() => toggleZone(zone.id)}>
                <View style={[styles.zoneBadge, { backgroundColor: zone.color }]} />
                <Text style={[styles.zoneHeaderTitle, dynamicStyles.textPrimary]}>{zone.name}</Text>
                <Text style={[styles.zoneChevron, dynamicStyles.textMuted, expanded && styles.zoneChevronOpen]}>›</Text>
              </TouchableOpacity>
              {expanded && (
                <View style={styles.subcategoriesList}>
                  {zone.categories.map((item) => (
                    <CategoryCard key={item.id} category={item} onPress={() => onSelectCategory(item)} theme={theme} />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footerNote}>
        <Text style={[styles.footerText, dynamicStyles.textMuted]}>Deepen connection through questions — for couples, friends, family, or anyone.</Text>
      </View>
    </SafeAreaView>
  );
}

function CardScreen({ category, onBack, onToggleFavorite, isFavorite, initialIndex = 0, onViewedCard, onShareQuestion, theme }) {
  const [index, setIndex] = React.useState(0);
  const [order, setOrder] = React.useState([...category.questions.map((_, i) => i)]);

  React.useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => {
    if (typeof onViewedCard === 'function') {
      onViewedCard();
    }
  }, [index]);

  const width = Dimensions.get('window').width;
  const panX = React.useRef(new Animated.Value(0)).current;
  const rotate = panX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-8deg', '0deg', '8deg'],
  });
  const scale = panX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [0.96, 1, 0.96],
    extrapolate: 'clamp',
  });
  const overlayOpacity = panX.interpolate({
    inputRange: [-120, 0],
    outputRange: [0.25, 0],
    extrapolate: 'clamp',
  });

  const animateInFrom = (dir = 'right') => {
    panX.setValue(dir === 'right' ? width * 0.75 : -width * 0.75);
    Animated.spring(panX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 90,
      friction: 10,
    }).start();
  };

  const goNext = () => {
    Animated.timing(panX, {
      toValue: -width,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIndex((prev) => (prev + 1) % order.length);
      animateInFrom('right');
    });
  };
  const goPrev = () => {
    Animated.timing(panX, {
      toValue: width,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIndex((prev) => (prev - 1 + order.length) % order.length);
      animateInFrom('left');
    });
  };
  const shuffle = () => {
    const arr = [...order];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setIndex(0);
    animateInFrom('right');
  };

  const q = category.questions[order[index]];
  const qNext = category.questions[order[(index + 1) % order.length]];

  const SWIPE_THRESHOLD = 80;
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6,
      onPanResponderMove: Animated.event([null, { dx: panX }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx <= -SWIPE_THRESHOLD) {
          goNext();
        } else if (gesture.dx >= SWIPE_THRESHOLD) {
          goPrev();
        } else {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true, tension: 180, friction: 20 }).start();
        }
      },
    })
  ).current;

  const favActive = isFavorite(category.id, q);
  const right = (
    <TouchableOpacity onPress={() => onToggleFavorite(category, q)} style={styles.favButton}>
      <Ionicons name={favActive ? 'star' : 'star-outline'} size={22} color={favActive ? theme.colors.primaryText : theme.colors.text} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <Header title={category.name} onBack={onBack} right={right} theme={theme} />
      <View style={styles.deckStack}>
        <View style={styles.stackInner}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.card,
              { borderColor: category.color, position: 'absolute', left: 0, right: 0, top: 0 },
              {
                transform: [
                  { translateX: panX.interpolate({ inputRange: [-width, 0], outputRange: [0, 20], extrapolate: 'clamp' }) },
                  { scale: panX.interpolate({ inputRange: [-width, 0], outputRange: [1, 0.98], extrapolate: 'clamp' }) },
                ],
                opacity: panX.interpolate({ inputRange: [-120, 0], outputRange: [0.85, 0.35], extrapolate: 'clamp' }),
              },
            ]}
          >
            <LinearGradient
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16, opacity: 0.12 }]}
              colors={[hexToRgba(category.color, 0.12), 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.cardPrompt}>{qNext}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              { borderColor: category.color, position: 'absolute', left: 0, right: 0, top: 0 },
              { transform: [{ translateX: panX }, { rotate }, { scale }] },
            ]}
            {...panResponder.panHandlers}
          >
            <LinearGradient
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16, opacity: overlayOpacity }]}
              colors={[hexToRgba(category.color, 0.08), 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.cardPrompt}>{q}</Text>
          </Animated.View>
        </View>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={goPrev}>
          <Text style={styles.controlText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={shuffle}>
          <Text style={styles.controlText}>Shuffle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => onShareQuestion && onShareQuestion(`${category.name}: ${q}`)}>
          <Text style={styles.controlText}>Share</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <TouchableOpacity style={styles.ctaButton} onPress={goNext}>
          <LinearGradient style={styles.ctaGradient} colors={[category.color || theme.colors.primary, theme.gradients.cta[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.ctaText}>Next Card</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={styles.progress}>
        <Text style={styles.progressText}>Card {index + 1} / {order.length}</Text>
      </View>
    </SafeAreaView>
  );
}

function FavoritesScreen({ items, onOpen, onRemove, onBack, onShareQuestion, theme }) {
  const grouped = React.useMemo(() => {
    const map = {};
    for (const f of items) {
      if (!map[f.categoryId]) map[f.categoryId] = { categoryId: f.categoryId, categoryName: f.categoryName, color: f.color, questions: [] };
      map[f.categoryId].questions.push(f.question);
    }
    return Object.values(map);
  }, [items]);

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Favorites" onBack={onBack} theme={theme} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {grouped.length === 0 ? (
          <Text style={styles.footerText}>No favorites yet. Add from any card.</Text>
        ) : (
          grouped.map((g) => (
            <View key={g.categoryId} style={styles.favoriteCategoryCard}>
              <View style={styles.favoriteHeaderRow}>
                <View style={[styles.zoneBadge, { backgroundColor: g.color }]} />
                <Text style={styles.zoneHeaderTitle}>{g.categoryName}</Text>
                <View style={styles.favoriteCountBadge}><Text style={styles.favoriteCountText}>{g.questions.length}</Text></View>
              </View>
              <View style={styles.favoriteQuestionsList}>
                {g.questions.map((q, i) => (
                  <View key={`${g.categoryId}-${i}`} style={styles.favoriteItemRow}>
                    <Text style={styles.favoriteQuestion}>{q}</Text>
                    <View style={styles.favoriteActions}>
                      <TouchableOpacity style={[styles.favoriteOpenBtn, { backgroundColor: g.color }]} onPress={() => onOpen({ categoryId: g.categoryId, question: q, color: g.color })}>
                        <Text style={styles.answerText}>Open</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.shareBtn} onPress={() => onShareQuestion && onShareQuestion(`${g.categoryName}: ${q}`)}>
                        <Text style={styles.shareText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove({ categoryId: g.categoryId, question: q })}>
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ShuffleScreen({ onOpen, onBack, onShareQuestion, theme }) {
  const [pick, setPick] = React.useState(() => randomPick());
  function randomPick() {
    const c = allCategories[Math.floor(Math.random() * allCategories.length)];
    const qi = Math.floor(Math.random() * c.questions.length);
    return { category: c, index: qi, question: c.questions[qi] };
  }
  const reroll = () => setPick(randomPick());
  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Shuffle" onBack={onBack} theme={theme} />
      <View style={styles.card}>
        <Text style={styles.cardPrompt}>{pick.question}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={reroll}>
          <Text style={styles.controlText}>Another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => onShareQuestion && onShareQuestion(`${pick.category.name}: ${pick.question}`)}>
          <Text style={styles.controlText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.primaryBtn, { backgroundColor: pick.category.color }]} onPress={() => onOpen(pick.category, pick.index)}>
          <Text style={[styles.controlText, styles.primaryText]}>Open Category</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ProfileScreen({ profile, setProfile, favoritesCount, stats, favorites = [], onViewAllFavorites, onEnableNotifications, onSignOut, onBack, isDarkMode, onToggleDarkMode, theme }) {
  const genders = ['Male','Female','Non-binary','Prefer not to say'];
  const [showEdit, setShowEdit] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [dailyReminderEnabled, setDailyReminderEnabled] = React.useState(false);
  const [weeklyHighlightsEnabled, setWeeklyHighlightsEnabled] = React.useState(false);
  const [newCategoryAlertEnabled, setNewCategoryAlertEnabled] = React.useState(false);

  React.useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const daily = await AsyncStorage.getItem(DAILY_REMINDER_KEY);
        const weekly = await AsyncStorage.getItem(WEEKLY_HIGHLIGHTS_KEY);
        const category = await AsyncStorage.getItem(NEW_CATEGORY_ALERT_KEY);
        
        console.log('Loading notification settings:', { daily, weekly, category });
        
        setDailyReminderEnabled(daily === 'true');
        setWeeklyHighlightsEnabled(weekly === 'true');
        setNewCategoryAlertEnabled(category === 'true');
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };
    loadNotificationSettings();
  }, []);

  const handleToggleNotification = async (type, newValue, setEnabled, storageKey, scheduleFunc) => {
    try {
      console.log(`Toggling ${type} to ${newValue}`);
      
      if (Platform.OS === 'web') {
        // For web, just update the state and storage without scheduling
        setEnabled(newValue);
        await AsyncStorage.setItem(storageKey, String(newValue));
        Alert.alert('Settings Updated', `${type} ${newValue ? 'enabled' : 'disabled'} (notifications not available on web)`);
        return;
      }
      
      // Only check permissions when enabling
      if (newValue === true) {
        const current = await Notifications.getPermissionsAsync();
        let status = current?.status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req?.status;
        }
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Enable notifications in system settings to receive reminders.');
          return;
        }
      }

      // Update state immediately
      setEnabled(newValue);
      
      // Then update storage
      await AsyncStorage.setItem(storageKey, String(newValue));
      console.log(`Saved ${type} setting: ${newValue}`);
      
      if (newValue === true && scheduleFunc) {
        const result = await scheduleFunc();
        console.log(`Scheduled ${type} notification:`, result);
        Alert.alert('Notification enabled', `You'll receive ${type} notifications.`);
      } else if (newValue === false) {
        Alert.alert('Notification disabled', `${type} notifications have been turned off.`);
      }
    } catch (e) {
      console.error(`Error toggling ${type}:`, e);
      Alert.alert('Error', 'Something went wrong updating notification settings.');
      // Revert state on error
      setEnabled(!newValue);
    }
  };
  const dynamicStyles = getDynamicStyles(theme);
  return (
    <SafeAreaView style={[styles.screen, dynamicStyles.bgBackground]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Header title="Profile" onBack={onBack} theme={theme} />

        {/* Top hero section to match mock */}
        <View style={[styles.profileHero, dynamicStyles.bgBackground]}>
          <View style={[styles.emojiCircle, dynamicStyles.bgSurface, dynamicStyles.borderColor]}>
            <Text style={styles.emojiIcon}>😊</Text>
          </View>
          <Text style={[styles.profileTitle, dynamicStyles.textPrimary]}>Hi, {profile?.name || 'Friend'}!</Text>
          <Text style={[styles.profileTagline, dynamicStyles.textMuted]}>Connecting through meaningful questions</Text>
        </View>

        {/* Progress section */}
        <View style={[styles.progressSection, dynamicStyles.bgBackground]}>
          <Text style={[styles.progressHeader, dynamicStyles.textPrimary]}>Your Progress</Text>
          <ProgressRing size={200} thickness={14} progress={(stats?.questionsRead ?? 0) / TOTAL_QUESTIONS} trackColor={theme.colors.border} progressColor={theme.colors.primary} theme={theme}>
            <Text style={[styles.progressRingValue, dynamicStyles.textPrimary]}>{stats?.questionsRead ?? 0}</Text>
            <Text style={[styles.progressRingSub, dynamicStyles.textMuted]}>of {TOTAL_QUESTIONS} goal</Text>
          </ProgressRing>
          <Text style={[styles.progressLabel, dynamicStyles.textMuted]}>Questions Read</Text>
        </View>

        <View style={styles.tileRow}>
          <StatTile theme={theme} icon={<Ionicons name="heart-outline" size={20} color={theme.colors.primaryText} style={styles.statTileIconI} />} label="Saved" value={favoritesCount ?? 0} />
          <StatTile theme={theme} icon={<Ionicons name="share-social-outline" size={20} color={theme.colors.primaryText} style={styles.statTileIconI} />} label="Shared" value={stats?.timesShared ?? 0} />
          <StatTile theme={theme} icon={<Ionicons name="flame-outline" size={20} color={theme.colors.primaryText} style={styles.statTileIconI} />} label="Streak" value={stats?.streakDays ?? 1} />
        </View>

          

          <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }, dynamicStyles.textMuted]}>Profile Settings</Text>
          {showNotifications ? (
            <View style={[styles.notificationsPanel, dynamicStyles.bgSurface, dynamicStyles.borderColor, dynamicStyles.shadowColor]}>
              <View style={[styles.notificationHeader, dynamicStyles.borderColor]}>
                <Text style={[styles.notificationTitle, dynamicStyles.textPrimary]}>Notification Settings</Text>
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <Text style={[styles.closeButton, dynamicStyles.textMuted]}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.notificationItem, dynamicStyles.borderColor]}>
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.notificationLabel, dynamicStyles.textPrimary]}>Daily Question Reminder</Text>
                  <Text style={[styles.notificationDescription, dynamicStyles.textMuted]}>Get reminded of your daily question at 9 AM</Text>
                </View>
                <Switch
                  value={dailyReminderEnabled}
                  onValueChange={(value) => handleToggleNotification('Daily Question', value, setDailyReminderEnabled, DAILY_REMINDER_KEY, scheduleDailyQuestionReminder)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={dailyReminderEnabled ? theme.colors.surface : theme.colors.surfaceTint}
                />
              </View>

              <View style={[styles.notificationItem, dynamicStyles.borderColor]}>
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.notificationLabel, dynamicStyles.textPrimary]}>Weekly Highlights</Text>
                  <Text style={[styles.notificationDescription, dynamicStyles.textMuted]}>Weekly summary every Monday at 10 AM</Text>
                </View>
                <Switch
                  value={weeklyHighlightsEnabled}
                  onValueChange={(value) => handleToggleNotification('Weekly Highlights', value, setWeeklyHighlightsEnabled, WEEKLY_HIGHLIGHTS_KEY, scheduleWeeklyHighlights)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={weeklyHighlightsEnabled ? theme.colors.surface : theme.colors.surfaceTint}
                />
              </View>

              <View style={[styles.notificationItem, dynamicStyles.borderColor]}>
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.notificationLabel, dynamicStyles.textPrimary]}>New Category Alert</Text>
                  <Text style={[styles.notificationDescription, dynamicStyles.textMuted]}>Get notified when new categories are added</Text>
                </View>
                <Switch
                  value={newCategoryAlertEnabled}
                  onValueChange={(value) => handleToggleNotification('New Category Alert', value, setNewCategoryAlertEnabled, NEW_CATEGORY_ALERT_KEY, scheduleNewCategoryAlert)}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={newCategoryAlertEnabled ? theme.colors.surface : theme.colors.surfaceTint}
                />
              </View>

              <View style={[styles.notificationItem, { borderBottomWidth: 0, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
                <View style={styles.notificationTextContainer}>
                  <Text style={[styles.notificationLabel, dynamicStyles.textPrimary]}>Dark Mode</Text>
                  <Text style={[styles.notificationDescription, dynamicStyles.textMuted]}>Switch to dark theme for better night viewing</Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={onToggleDarkMode}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={isDarkMode ? theme.colors.surface : theme.colors.surfaceTint}
                />
              </View>
            </View>
          ) : (
            <SettingsList onEditProfile={() => setShowEdit((v) => !v)} onEnableNotifications={() => setShowNotifications(true)} onSignOut={onSignOut} theme={theme} />
          )}

          {showEdit && (
            <View style={{ marginTop: 10 }}>
              <View style={styles.formRow}>
                <Text style={[styles.formLabel, dynamicStyles.textMuted]}>Display Name</Text>
                <TextInput
                  value={profile?.name ?? ''}
                  onChangeText={(t) => setProfile({ ...(profile||{}), name: t })}
                  placeholder="Your name"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[styles.input, dynamicStyles.bgSurfaceTint, dynamicStyles.borderColor, { color: theme.colors.text }]}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={[styles.formLabel, dynamicStyles.textMuted]}>Gender</Text>
                <View style={styles.genderRow}>
                  {genders.map((g) => (
                    <TouchableOpacity key={g} style={[styles.genderBtn, dynamicStyles.bgSurfaceTint, profile?.gender===g && [styles.genderBtnActive, dynamicStyles.borderColor]]} onPress={() => setProfile({ ...(profile||{}), gender: g })}>
                      <Text style={[styles.genderBtnText, dynamicStyles.textPrimary]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              
            </View>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BottomNav({ current, onNavigate, favoritesCount, theme }) {
  const item = (key, label, iconName, count = 0) => (
    <TouchableOpacity style={[styles.navItem, current===key && styles.navItemActive]} onPress={() => onNavigate(key)}>
      <Ionicons name={iconName} size={20} color={current===key ? theme.colors.primaryText : theme.colors.textMuted} style={styles.navIcon} />
      {key === 'favorites' && count > 0 && (
        <View style={styles.navBadge}><Text style={styles.navBadgeText}>{count}</Text></View>
      )}
      <Text style={[styles.navLabel, current===key && styles.navLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
  return (
    <View style={styles.bottomNav}>
      {item('home','Home','home-outline')}
      {item('favorites','Favorites','star-outline', favoritesCount)}
      {item('shuffle','Shuffle','shuffle-outline')}
      {item('profile','Profile','person-circle-outline')}
    </View>
  );
}

export default function App() {
  const [selected, setSelected] = React.useState(null);
  const [showMood, setShowMood] = React.useState(true);
  const [mood, setMood] = React.useState(null);
  const [favorites, setFavorites] = React.useState([]);
  const [tab, setTab] = React.useState('home');
  const [shuffleKey, setShuffleKey] = React.useState(0);
  
  const [initialIndex, setInitialIndex] = React.useState(0);
  const [hasHydratedFavorites, setHasHydratedFavorites] = React.useState(false);
  
  const [profile, setProfile] = React.useState({ name: 'Friend', gender: 'Prefer not to say' });
  const [stats, setStats] = React.useState({ questionsRead: 0, timesShared: 0, streakDays: 1, lastActiveDate: getDateKey() });
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState(lightTheme);

  const handleToggleDarkMode = async (value) => {
    try {
      setIsDarkMode(value);
      const newTheme = value ? darkTheme : lightTheme;
      setCurrentTheme(newTheme);
      await AsyncStorage.setItem(DARK_MODE_KEY, String(value));
      console.log(`Dark mode ${value ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling dark mode:', error);
      // Revert on error
      setIsDarkMode(!value);
      setCurrentTheme(!value ? darkTheme : lightTheme);
    }
  };

  

  React.useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setFavorites(parsed);
          }
        }
        
        const profRaw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
        if (profRaw) {
          const p = JSON.parse(profRaw);
          if (p && typeof p === 'object') setProfile((prev) => ({ ...prev, ...p }));
        }
        const statsRaw = await AsyncStorage.getItem(STATS_STORAGE_KEY);
        if (statsRaw) {
          const s = JSON.parse(statsRaw);
          if (s && typeof s === 'object') setStats((prev) => ({ ...prev, ...s }));
        }
        
        // Load dark mode setting
        const darkModeRaw = await AsyncStorage.getItem(DARK_MODE_KEY);
        const isDark = darkModeRaw === 'true';
        setIsDarkMode(isDark);
        setCurrentTheme(isDark ? darkTheme : lightTheme);
      } catch (e) {
        // noop: fail silently
      } finally {
        setHasHydratedFavorites(true);
      }
    })();
  }, []);

  

  React.useEffect(() => {
    if (!hasHydratedFavorites) return;
    (async () => {
      try {
        await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (e) {
        // noop
      }
    })();
  }, [favorites, hasHydratedFavorites]);

  React.useEffect(() => {
    (async () => {
      try { await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile)); } catch {}
    })();
  }, [profile]);

  React.useEffect(() => {
    (async () => {
      try { await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats)); } catch {}
    })();
  }, [stats]);

  // Update connection streak based on activity
  const updateStreakOnActivity = () => {
    setStats((prev) => {
      const today = getDateKey();
      if (prev.lastActiveDate === today) return prev;
      const last = new Date(prev.lastActiveDate);
      const curr = new Date(today);
      const diffDays = Math.round((curr - last) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        return { ...prev, streakDays: (prev.streakDays || 1) + 1, lastActiveDate: today };
      }
      return { ...prev, streakDays: 1, lastActiveDate: today };
    });
  };

  

  

  const handleSelectMood = (m) => {
    setMood(m);
    setShowMood(false);
    updateStreakOnActivity();
  };

  const isFavorite = (categoryId, question) => favorites.some(f => f.categoryId === categoryId && f.question === question);
  const toggleFavorite = (category, question) => {
    setFavorites((prev) => {
      const exists = prev.find(f => f.categoryId === category.id && f.question === question);
      if (exists) return prev.filter(f => !(f.categoryId === category.id && f.question === question));
      return [...prev, { categoryId: category.id, categoryName: category.name, color: category.color, question }];
    });
  };

  const openCategoryAt = (category, qIndex) => {
    setSelected(category);
    setInitialIndex(qIndex);
    setTab('home');
  };

  // Activity hooks
  const onViewedCard = () => {
    setStats((s) => ({ ...s, questionsRead: (s.questionsRead || 0) + 1 }));
    updateStreakOnActivity();
  };

  const onShareQuestion = async (text) => {
    const ok = await shareQuestionText(text);
    if (ok) {
      setStats((s) => ({ ...s, timesShared: (s.timesShared || 0) + 1 }));
      updateStreakOnActivity();
    }
  };

  let Screen;
  if (selected) {
    Screen = (
      <CardScreen
        category={selected}
        initialIndex={initialIndex}
        onBack={() => setSelected(null)}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        onViewedCard={onViewedCard}
        onShareQuestion={onShareQuestion}
        theme={currentTheme}
      />
    );
  } else {
    if (tab === 'favorites') {
      Screen = (
        <FavoritesScreen
          onBack={() => setTab('home')}
          items={favorites}
          onOpen={(f) => {
            const cat = allCategories.find(c => c.id === f.categoryId);
            const idx = cat.questions.findIndex(q => q === f.question);
            openCategoryAt(cat, Math.max(idx, 0));
          }}
          onShareQuestion={onShareQuestion}
          onRemove={(f) => setFavorites(prev => prev.filter(x => !(x.categoryId===f.categoryId && x.question===f.question)))}
          theme={currentTheme}
        />
      );
    } else if (tab === 'shuffle') {
      Screen = (
        <ShuffleScreen onBack={() => setTab('home')} onOpen={openCategoryAt} onShareQuestion={onShareQuestion} key={shuffleKey} theme={currentTheme} />
      );
    } else if (tab === 'profile') {
      Screen = (
        <ProfileScreen
          onBack={() => setTab('home')}
          profile={profile}
          setProfile={setProfile}
          favoritesCount={favorites.length}
          stats={stats}
          favorites={favorites}
          onViewAllFavorites={() => setTab('favorites')}
          onEnableNotifications={enableDailyReminders}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          theme={currentTheme}
        />
      );
    } else {
      Screen = (
        <HomeScreen profile={profile} stats={stats} onSelectCategory={(c) => setSelected(c)} onAnswerDaily={(cat, idx) => openCategoryAt(cat, idx)} theme={currentTheme} />
      );
    }
  }

  const navigate = (key) => {
    setSelected(null);
    if (key === 'shuffle') {
      setShuffleKey((prev) => prev + 1);
    }
    setTab(key);
  };

  // Reschedule reminder when app becomes active and mark last active timestamp
  React.useEffect(() => {
    const onActive = async () => {
      try {
        await AsyncStorage.setItem(LAST_ACTIVE_TS_KEY, String(Date.now()));
        const enabled = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
        if (enabled === 'true') {
          await scheduleReengageReminder();
        }
        
        // Reschedule individual notification types if enabled
        const dailyEnabled = await AsyncStorage.getItem(DAILY_REMINDER_KEY);
        const weeklyEnabled = await AsyncStorage.getItem(WEEKLY_HIGHLIGHTS_KEY);
        const categoryEnabled = await AsyncStorage.getItem(NEW_CATEGORY_ALERT_KEY);
        
        if (dailyEnabled === 'true') {
          await scheduleDailyQuestionReminder();
        }
        if (weeklyEnabled === 'true') {
          await scheduleWeeklyHighlights();
        }
        if (categoryEnabled === 'true') {
          await scheduleNewCategoryAlert();
        }
      } catch {}
    };
    onActive();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') onActive();
    });
    return () => {
      try { sub?.remove?.(); } catch {}
    };
  }, []);

  

  

  const Root = (
    <View style={{ flex: 1 }}>
      {Screen}
      <BottomNav current={tab} onNavigate={navigate} favoritesCount={favorites.length} theme={currentTheme} />
      {showMood && <MoodMeter onSelect={handleSelectMood} theme={currentTheme} />}
    </View>
  );

  return (
    <LinearGradient colors={[currentTheme.colors.surfaceTint, currentTheme.colors.background]} style={{ flex: 1 }}>
      {Root}
    </LinearGradient>
  );
}

// Dynamic style functions that use theme
const getDynamicStyles = (theme) => ({
  // Text colors
  textPrimary: { color: theme.colors.text },
  textMuted: { color: theme.colors.textMuted },
  textPrimaryText: { color: theme.colors.primaryText },
  
  // Background colors
  bgSurface: { backgroundColor: theme.colors.surface },
  bgSurfaceTint: { backgroundColor: theme.colors.surfaceTint },
  bgBackground: { backgroundColor: theme.colors.background },
  
  // Border colors
  borderColor: { borderColor: theme.colors.border },
  
  // Shadow colors
  shadowColor: { shadowColor: theme.colors.shadow },
});

const styles = StyleSheet.create({
  onboardingContainer: { flex: 1, justifyContent: 'center' },
  particlesLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  onboardingContent: { alignItems: 'center', paddingHorizontal: 24 },
  onboardingIcon: { fontSize: 68, textShadowColor: '#CBB2FF', textShadowRadius: 16 },
  onboardingTitle: { color: '#3B245A', fontSize: 32, fontWeight: '800', marginTop: 8 },
  onboardingTagline: { color: '#6B4C9A', fontSize: 16, marginTop: 6 },
  floatingIcon: { position: 'absolute', fontSize: 24, opacity: 0.7 },

  // Auth landing and forms
  

  // Auth form inputs
  

  ctaButton: { marginTop: 28, borderRadius: 18, overflow: 'hidden' },
  ctaGradient: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 18 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  guestLinkBtn: { marginTop: 10 },
  guestLink: { color: '#6B4C9A', fontSize: 14 },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  brandLogoWrap: { position: 'relative', width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  glowCircle: { position: 'absolute', left: 0, top: 0 },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F5F0FF',
  },
  backText: { color: '#6B4C9A', fontSize: 16 },
  headerTitle: { color: '#3B245A', fontSize: 20, fontWeight: '600' },
  brandHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  brandIcon: { fontSize: 36 },
  brandTitle: { color: '#3B245A', fontSize: 28, fontWeight: '700', marginTop: 6 },
  brandTagline: { color: '#6B4C9A', fontSize: 14, marginTop: 4 },
  profileHero: { alignItems: 'center', paddingVertical: 12 },
  profileTitle: { color: '#3B245A', fontSize: 28, fontWeight: '800', marginTop: 12 },
  profileTagline: { color: '#7A6FA3', fontSize: 14, marginTop: 6 },
  emojiCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6D6FF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(124,77,255,0.18)', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14 },
  emojiIcon: { fontSize: 40 },
  progressSection: { alignItems: 'center', paddingTop: 12, paddingBottom: 12 },
  progressHeader: { color: '#2F2752', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  progressRing: { width: 200, height: 200, borderRadius: 100, borderWidth: 14, borderColor: '#E6D6FF', alignItems: 'center', justifyContent: 'center' },
  progressRingContent: { alignItems: 'center', justifyContent: 'center' },
  progressRingValue: { color: '#2F2752', fontSize: 24, fontWeight: '800' },
  progressRingSub: { color: '#7A6FA3', fontSize: 13, marginTop: 4 },
  progressLabel: { color: '#7A6FA3', fontSize: 16, marginTop: 12 },
  sectionTitle: {
    color: '#7A6FA3',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  panel: { backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: '#E6D6FF', padding: 16, shadowColor: 'rgba(124,77,255,0.18)', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14 },
  heroTitle: { color: '#2F2752', fontSize: 32, fontWeight: '800', marginBottom: 10 },
  streakLabel: { color: '#7A6FA3', fontSize: 13 },
  zoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    marginBottom: 12,
    shadowColor: 'rgba(124,77,255,0.18)',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  zoneHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  zoneBadge: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  zoneHeaderTitle: { color: '#2F2752', fontSize: 18, fontWeight: '700', flex: 1 },
  zoneChevron: { color: '#7A6FA3', fontSize: 22 },
  zoneChevronOpen: { transform: [{ rotate: '90deg' }] },
  subcategoriesList: { paddingHorizontal: 14, paddingBottom: 12 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6D6FF',
    minWidth: 260,
    shadowColor: 'rgba(124,77,255,0.18)',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    marginBottom: 10,
  },
  deckBadge: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  deckTitle: { color: '#2F2752', fontSize: 18, fontWeight: '700' },
  deckSubtitle: { color: '#7A6FA3', fontSize: 13, marginTop: 2 },
  chevron: { color: '#7A6FA3', fontSize: 24, marginLeft: 12 },
  footerNote: { paddingHorizontal: 16, paddingTop: 8 },
  footerText: { color: '#7A6FA3', fontSize: 13 },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    minHeight: 220,
    justifyContent: 'center',
    maxWidth: 640,
    alignSelf: 'center',
  },
  cardPrompt: { color: '#2F2752', fontSize: 20, lineHeight: 28 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  controlBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5EEFF',
    alignItems: 'center',
  },
  primaryBtn: {},
  controlText: { color: '#2F2752', fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  progress: { alignItems: 'center', marginTop: 8 },
  deckStack: { minHeight: 280, position: 'relative', marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  stackInner: { width: '100%', maxWidth: 640, marginHorizontal: 16, alignSelf: 'center', position: 'relative', minHeight: 240 },
  progressText: { color: '#7A6FA3', fontSize: 13 },
  favButton: { paddingHorizontal: 10, paddingVertical: 6 },
  favStar: { fontSize: 22, textShadowColor: '#B388FF', textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } },
  favStarActive: { color: '#3B245A', textShadowRadius: 14 },
  cardFavButton: { position: 'absolute', right: 12, top: 12, padding: 4 },
  cardFavStar: { fontSize: 22, textShadowColor: '#B388FF', textShadowRadius: 8 },
  cardFavStarActive: { color: '#3B245A', textShadowRadius: 12 },
  tileRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 12 },
  statTile: { flex: 1, marginRight: 8, backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6D6FF', paddingVertical: 12, paddingHorizontal: 12, shadowColor: 'rgba(124,77,255,0.18)', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
  statTileHeader: { flexDirection: 'row', alignItems: 'center' },
  statTileIcon: { fontSize: 18, marginRight: 8 },
  statTileLabel: { color: '#7A6FA3', fontSize: 13 },
  statTileValue: { color: '#3B245A', fontSize: 24, fontWeight: '800', marginTop: 6 },
  moodOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(47,39,82,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  moodCard: {
    width: '92%',
    maxWidth: 560,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6D6FF',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  moodTitle: { color: '#2F2752', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  moodSubtitle: { color: '#7A6FA3', fontSize: 14, textAlign: 'center', marginTop: 6 },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  moodItem: {
    width: '48%',
    marginBottom: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F5EEFF',
    borderWidth: 1,
    borderColor: '#E6D6FF',
    alignItems: 'center',
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { color: '#2F2752', fontSize: 14, marginTop: 6 },
  moodHint: { color: '#7A6FA3', fontSize: 12, textAlign: 'center', marginTop: 8 },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E6D6FF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    zIndex: 100,
  },
  navItem: { alignItems: 'center', paddingHorizontal: 6, position: 'relative' },
  navItemActive: { },
  navIcon: { fontSize: 18 },
  navLabel: { color: '#7A6FA3', fontSize: 12 },
  navLabelActive: { color: '#3B245A', fontWeight: '700' },
  navBadge: { position: 'absolute', top: -2, right: 6, backgroundColor: '#9D4EDD', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  navBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  dailyCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6D6FF',
    shadowColor: 'rgba(124,77,255,0.18)',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  dailyTitle: { color: '#3B245A', fontSize: 16, fontWeight: '700' },
  dailyPrompt: { color: '#2F2752', fontSize: 16, marginTop: 6 },
  answerBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  answerText: { color: '#fff', fontWeight: '700' },
  favoriteCategoryCard: { padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6D6FF', marginBottom: 12 },
  favoriteHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  favoriteCountBadge: { marginLeft: 8, backgroundColor: '#F5EEFF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  favoriteCountText: { color: '#7A6FA3', fontSize: 12, fontWeight: '700' },
  favoriteQuestionsList: { marginTop: 10 },
  favoriteItemRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  favoriteQuestion: { color: '#2F2752', fontSize: 16, flex: 1, marginRight: 12 },
  favoriteActions: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  favoriteOpenBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center' },
  shareBtn: { marginLeft: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F5EEFF' },
  shareText: { color: '#2F2752' },
  removeBtn: { marginLeft: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F5EEFF' },
  removeText: { color: '#2F2752' },
  themeRow: { flexDirection: 'row', marginTop: 10 },
  themeBtn: { marginRight: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F5EEFF' },
  themeBtnActive: { borderWidth: 1, borderColor: '#E6D6FF' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F5EEFF', alignItems: 'center', justifyContent: 'center' },
  profileGreeting: { color: '#3B245A', fontSize: 22, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  statCard: { flex: 1, marginRight: 8, padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6D6FF' },
  statLabel: { color: '#7A6FA3', fontSize: 13 },
  statValue: { color: '#3B245A', fontSize: 22, fontWeight: '800', marginTop: 6 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 8, marginBottom: 6 },
  viewAllLink: { color: '#7A6FA3', fontSize: 13 },
  favoritePreviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6D6FF', marginHorizontal: 16, marginBottom: 8 },
  favoriteDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9D4EDD', marginRight: 10 },
  favoritePreviewText: { color: '#2F2752', fontSize: 16, flex: 1 },
  highlightsRow: { flexDirection: 'row', marginTop: 10 },
  highlightText: { color: '#2F2752', fontSize: 16, marginTop: 10 },
  highlightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6D6FF', paddingVertical: 12, paddingHorizontal: 12, shadowColor: 'rgba(124,77,255,0.18)', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, marginBottom: 12 },
  highlightIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5EEFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  highlightIcon: { fontSize: 20 },
  highlightTitle: { color: '#2F2752', fontSize: 16, fontWeight: '700' },
  highlightSubtitle: { color: '#7A6FA3', fontSize: 13, marginTop: 2 },
  formRow: { marginTop: 12 },
  formLabel: { color: '#7A6FA3', fontSize: 13, marginBottom: 6 },
  input: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F5EEFF', borderWidth: 1, borderColor: '#E6D6FF', color: '#2F2752' },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap' },
  genderBtn: { marginRight: 8, marginBottom: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F5EEFF' },
  genderBtnActive: { borderWidth: 1, borderColor: '#E6D6FF' },
  genderBtnText: { color: '#2F2752' },
  listCard: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6D6FF', shadowColor: 'rgba(124,77,255,0.18)', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, marginBottom: 12 },
  listItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E6D6FF' },
  listIconI: { marginRight: 12 },
  listItemText: { color: '#2F2752', fontSize: 16, flex: 1 },
  listChevron: { color: '#7A6FA3', fontSize: 22 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12 },
  settingLabel: { color: '#2F2752', fontSize: 16, fontWeight: '600' },
  settingDivider: { height: 1, backgroundColor: '#E6D6FF' },
  searchRow: { marginTop: 12, marginBottom: 16 },
  searchInput: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F5EEFF', borderWidth: 1, borderColor: '#E6D6FF', color: '#2F2752' },
  statTileIconI: { marginRight: 8 },
  // Notification Panel Styles
  notificationsPanel: { backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6D6FF', shadowColor: 'rgba(124,77,255,0.18)', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, marginBottom: 12, padding: 16 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E6D6FF' },
  notificationTitle: { color: '#2F2752', fontSize: 18, fontWeight: '700' },
  closeButton: { color: '#7A6FA3', fontSize: 20, fontWeight: '600' },
  notificationItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E6D6FF' },
  notificationTextContainer: { flex: 1, marginRight: 12 },
  notificationLabel: { color: '#2F2752', fontSize: 16, fontWeight: '600' },
  notificationDescription: { color: '#7A6FA3', fontSize: 13, marginTop: 2 },
});
