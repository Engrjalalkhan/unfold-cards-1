import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ScrollView, LayoutAnimation, Platform, UIManager, Animated, Easing, Dimensions, TextInput, Share, PanResponder, Alert, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { zones } from './data/decks';
import { theme } from './theme';
import { allCategories } from './data/decks';

const FAVORITES_STORAGE_KEY = '@unflod_cards:favorites:v1';
const ONBOARDING_STORAGE_KEY = '@unflod_cards:onboarding_done:v1';
const PROFILE_STORAGE_KEY = '@unflod_cards:profile:v1';
const STATS_STORAGE_KEY = '@unflod_cards:stats:v1';
const NOTIF_ENABLED_KEY = '@unflod_cards:notif_enabled:v1';
const LAST_ACTIVE_TS_KEY = '@unflod_cards:last_active_ts:v1';
const REENGAGE_ID_KEY = '@unflod_cards:reengage_id:v1';
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

// Notifications handler: show alerts, no sound/badge by default
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
    // Cancel prior scheduled reminders to avoid stacking
    await Notifications.cancelAllScheduledNotificationsAsync();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Keep the connection going',
        body: pickSuggestionBody(),
        data: { type: 'reengage' },
      },
      // Fire daily at 7:00 PM local time
      trigger: { hour: 19, minute: 0, repeats: true },
    });
    await AsyncStorage.setItem(REENGAGE_ID_KEY, id);
  } catch (e) {
    // noop
  }
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

function Header({ title, onBack, right }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 64 }} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {right ? right : <View style={{ width: 64 }} />}
    </View>
  );
}

function BrandHeader() {
  return (
    <View style={styles.brandHeader}>
      <Text style={styles.brandIcon}>💜</Text>
      <Text style={styles.brandTitle}>Unfold Cards</Text>
      <Text style={styles.brandTagline}>Build meaningful connections</Text>
    </View>
  );
}

// Small reusable UI primitives to match design
const StatTile = React.memo(function StatTile({ icon, label, value, suffix }) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statTileHeader}>
        <Text style={styles.statTileIcon}>{icon}</Text>
        <Text style={styles.statTileLabel}>{label}</Text>
      </View>
      <Text style={styles.statTileValue}>
        {value}{suffix ? ` ${suffix}` : ''}
      </Text>
    </View>
  );
});

// Visual circular progress arc without external dependencies
function ProgressRing({ size = 200, thickness = 14, progress = 0, trackColor = theme.colors.border, progressColor = theme.colors.primary, children }) {
  const clamped = Math.max(0, Math.min(1, progress || 0));
  const anim = React.useRef(new Animated.Value(clamped)).current;

  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const rightRotate = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
  });
  const leftRotate = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
  });

  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: trackColor, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Right half progress */}
      <View style={{ position: 'absolute', right: 0, top: 0, width: size / 2, height: size, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', left: -size / 2, top: 0, width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: progressColor, transform: [{ rotate: '-90deg' }, { rotate: rightRotate }] }} />
      </View>
      {/* Left half progress */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: size / 2, height: size, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: progressColor, transform: [{ rotate: '-90deg' }, { rotate: leftRotate }] }} />
      </View>

      <View style={styles.progressRingContent}>{children}</View>
    </View>
  );
}

const Chip = React.memo(function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
});

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

const SettingsList = React.memo(function SettingsList({ onEditProfile, onEnableNotifications }) {
  return (
    <View style={styles.listCard}>
      <TouchableOpacity style={styles.listItemRow} onPress={onEditProfile}>
        <Ionicons name="book-outline" size={20} color={theme.colors.primaryText} style={styles.listIconI} />
        <Text style={styles.listItemText}>Edit Profile & Account</Text>
        <Text style={styles.listChevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.listItemRow} onPress={onEnableNotifications}>
        <Ionicons name="notifications-outline" size={20} color={theme.colors.primaryText} style={styles.listIconI} />
        <Text style={styles.listItemText}>Notifications</Text>
        <Text style={styles.listChevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.listItemRow}>
        <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primaryText} style={styles.listIconI} />
        <Text style={styles.listItemText}>Privacy & Support</Text>
        <Text style={styles.listChevron}>›</Text>
      </TouchableOpacity>
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

function SoftParticles() {
  const { width, height } = Dimensions.get('window');
  const palette = ['rgba(157,78,221,0.18)', 'rgba(201,179,255,0.20)', 'rgba(233,215,255,0.16)'];
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

function OnboardingScreen({ onContinue }) {
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
    <LinearGradient colors={["#E9D7FF", "#FFFFFF"]} style={styles.onboardingContainer}>
      <SoftParticles />
      <View style={styles.onboardingContent}>
        <Text style={styles.onboardingIcon}>💬</Text>
        <Text style={styles.onboardingTitle}>Unfold Cards</Text>
        <Text style={styles.onboardingTagline}>Unfold deeper connections.</Text>

        {floating.map((f, i) => (
          <Text key={i} style={[styles.floatingIcon, f.style]}>{f.emoji}</Text>
        ))}

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity onPress={onContinue} activeOpacity={0.9} style={styles.ctaButton}>
            <LinearGradient colors={["#9D4EDD", "#7B2CBF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaGradient}>
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

function MoodMeter({ onSelect }) {
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

function CategoryCard({ category, onPress }) {
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
          colors={[tint, theme.colors.surface]}
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

function ZoneSection({ zone, onSelectCategory }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.sectionTitle, { color: zone.color }]}>{zone.name}</Text>
      {/* Placeholder; actual accordion handled in HomeScreen to control single expansion */}
    </View>
  );
}

function DailyQuestion({ onAnswer }) {
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

function HomeScreen({ onSelectCategory, onAnswerDaily, profile, stats }) {
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

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.brandHeader}>
        <Text style={styles.heroTitle}>Hi, {profile?.name || 'Friend'}!</Text>
        <Text style={styles.streakLabel}>🔥 Connection Streak: {stats?.streakDays ?? 1} Days</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}>
        <View style={[styles.panel, { marginTop: 4 }]}>
          <DailyQuestion key={todayKey} onAnswer={onAnswerDaily} />
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search topics"
            style={styles.searchInput}
          />
        </View>

        <Text style={styles.sectionTitle}>Explore Zones</Text>

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
            <View key={zone.id} style={styles.zoneCard}>
              <LinearGradient
                style={[StyleSheet.absoluteFillObject, { borderRadius: 18 }]}
                colors={theme.gradients.zone}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <TouchableOpacity activeOpacity={0.85} style={styles.zoneHeaderRow} onPress={() => toggleZone(zone.id)}>
                <View style={[styles.zoneBadge, { backgroundColor: zone.color }]} />
                <Text style={styles.zoneHeaderTitle}>{zone.name}</Text>
                <Text style={[styles.zoneChevron, expanded && styles.zoneChevronOpen]}>›</Text>
              </TouchableOpacity>
              {expanded && (
                <View style={styles.subcategoriesList}>
                  {zone.categories.map((item) => (
                    <CategoryCard key={item.id} category={item} onPress={() => onSelectCategory(item)} />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.footerNote}>
        <Text style={styles.footerText}>Deepen connection through questions — for couples, friends, family, or anyone.</Text>
      </View>
    </SafeAreaView>
  );
}

function CardScreen({ category, onBack, onToggleFavorite, isFavorite, initialIndex = 0, onViewedCard, onShareQuestion }) {
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
      <Header title={category.name} onBack={onBack} right={right} />
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
        <TouchableOpacity style={styles.controlBtn} onPress={() => onShareQuestion && onShareQuestion(q)}>
          <Text style={styles.controlText}>Share</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <TouchableOpacity style={styles.ctaButton} onPress={goNext}>
          <LinearGradient style={styles.ctaGradient} colors={[category.color, '#B388FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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

function FavoritesScreen({ items, onOpen, onRemove }) {
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
      <Header title="Favorites" />
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

function ShuffleScreen({ onOpen }) {
  const [pick, setPick] = React.useState(() => randomPick());
  function randomPick() {
    const c = allCategories[Math.floor(Math.random() * allCategories.length)];
    const qi = Math.floor(Math.random() * c.questions.length);
    return { category: c, index: qi, question: c.questions[qi] };
  }
  const reroll = () => setPick(randomPick());
  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Shuffle" />
      <View style={styles.card}>
        <Text style={styles.cardPrompt}>{pick.question}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={reroll}>
          <Text style={styles.controlText}>Another</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.primaryBtn, { backgroundColor: pick.category.color }]} onPress={() => onOpen(pick.category, pick.index)}>
          <Text style={[styles.controlText, styles.primaryText]}>Open Category</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ProfileScreen({ profile, setProfile, favoritesCount, stats, favorites = [], onViewAllFavorites, onEnableNotifications }) {
  const genders = ['Male','Female','Non-binary','Prefer not to say'];
  const [filter, setFilter] = React.useState('All');
  const [showEdit, setShowEdit] = React.useState(false);
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Header title="Profile" />

        {/* Top hero section to match mock */}
        <View style={styles.profileHero}>
          <View style={styles.emojiCircle}>
            <Text style={styles.emojiIcon}>😊</Text>
          </View>
          <Text style={styles.profileTitle}>Hi, {profile?.name || 'Friend'}!</Text>
          <Text style={styles.profileTagline}>Connecting through meaningful questions</Text>
        </View>

        {/* Progress section */}
        <View style={styles.progressSection}>
          <Text style={styles.progressHeader}>Your Progress</Text>
          <ProgressRing size={200} thickness={14} progress={(stats?.questionsRead ?? 0) / TOTAL_QUESTIONS} trackColor={theme.colors.border} progressColor={theme.colors.primary}>
            <Text style={styles.progressRingValue}>{stats?.questionsRead ?? 0}</Text>
            <Text style={styles.progressRingSub}>of {TOTAL_QUESTIONS} goal</Text>
          </ProgressRing>
          <Text style={styles.progressLabel}>Questions Read</Text>
        </View>

        <View style={styles.tileRow}>
          <StatTile icon={<Ionicons name="heart-outline" size={20} color={theme.colors.primaryText} style={styles.statTileIconI} />} label="Saved" value={favoritesCount ?? 0} />
          <StatTile icon={<Ionicons name="share-social-outline" size={20} color={theme.colors.primaryText} style={styles.statTileIconI} />} label="Shared" value={stats?.timesShared ?? 0} />
          <StatTile icon={<Ionicons name="flame-outline" size={20} color={theme.colors.primaryText} style={styles.statTileIconI} />} label="Streak" value={stats?.streakDays ?? 1} />
        </View>

          <View style={styles.chipFilterRow}>
            {['All','Personal','Social'].map((l) => (
              <Chip key={l} label={l} selected={filter===l} onPress={() => setFilter(l)} />
            ))}
          </View>

          <Text style={[styles.sectionTitle, { paddingHorizontal: 0 }]}>Profile Settings</Text>
          <SettingsList onEditProfile={() => setShowEdit((v) => !v)} onEnableNotifications={onEnableNotifications} />

          {showEdit && (
            <View style={{ marginTop: 10 }}>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Display Name</Text>
                <TextInput
                  value={profile?.name ?? ''}
                  onChangeText={(t) => setProfile({ ...(profile||{}), name: t })}
                  placeholder="Your name"
                  style={styles.input}
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Gender</Text>
                <View style={styles.genderRow}>
                  {genders.map((g) => (
                    <TouchableOpacity key={g} style={[styles.genderBtn, profile?.gender===g && styles.genderBtnActive]} onPress={() => setProfile({ ...(profile||{}), gender: g })}>
                      <Text style={styles.genderBtnText}>{g}</Text>
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

function BottomNav({ current, onNavigate, favoritesCount }) {
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
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [profile, setProfile] = React.useState({ name: 'Friend', gender: 'Prefer not to say' });
  const [stats, setStats] = React.useState({ questionsRead: 0, timesShared: 0, streakDays: 1, lastActiveDate: getDateKey() });

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
        const onboard = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (onboard === 'done') {
          setShowOnboarding(false);
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

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'done');
    } catch {}
    setShowOnboarding(false);
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
    try { await Share.share({ message: text }); } catch {}
    setStats((s) => ({ ...s, timesShared: (s.timesShared || 0) + 1 }));
    updateStreakOnActivity();
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
      />
    );
  } else {
    if (tab === 'favorites') {
      Screen = (
        <FavoritesScreen
          items={favorites}
          onOpen={(f) => {
            const cat = allCategories.find(c => c.id === f.categoryId);
            const idx = cat.questions.findIndex(q => q === f.question);
            openCategoryAt(cat, Math.max(idx, 0));
          }}
          onRemove={(f) => setFavorites(prev => prev.filter(x => !(x.categoryId===f.categoryId && x.question===f.question)))}
        />
      );
    } else if (tab === 'shuffle') {
      Screen = (
        <ShuffleScreen onOpen={openCategoryAt} key={shuffleKey} />
      );
    } else if (tab === 'profile') {
      Screen = (
        <ProfileScreen
          profile={profile}
          setProfile={setProfile}
          favoritesCount={favorites.length}
          stats={stats}
          favorites={favorites}
          onViewAllFavorites={() => setTab('favorites')}
          onEnableNotifications={enableDailyReminders}
        />
      );
    } else {
      Screen = (
        <HomeScreen profile={profile} stats={stats} onSelectCategory={(c) => setSelected(c)} onAnswerDaily={(cat, idx) => openCategoryAt(cat, idx)} />
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

  // Show onboarding after hooks are declared to keep hook order stable
  if (showOnboarding) {
    return <OnboardingScreen onContinue={completeOnboarding} />;
  }

  const Root = (
    <View style={{ flex: 1 }}>
      {Screen}
      <BottomNav current={tab} onNavigate={navigate} favoritesCount={favorites.length} />
      {showMood && !showOnboarding && <MoodMeter onSelect={handleSelectMood} />}
    </View>
  );

  return (
    <LinearGradient colors={[theme.colors.surfaceTint, theme.colors.background]} style={{ flex: 1 }}>
      {Root}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  onboardingContainer: { flex: 1, justifyContent: 'center' },
  particlesLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  onboardingContent: { alignItems: 'center', paddingHorizontal: 24 },
  onboardingIcon: { fontSize: 68, textShadowColor: '#CBB2FF', textShadowRadius: 16 },
  onboardingTitle: { color: '#3B245A', fontSize: 32, fontWeight: '800', marginTop: 8 },
  onboardingTagline: { color: '#6B4C9A', fontSize: 16, marginTop: 6 },
  floatingIcon: { position: 'absolute', fontSize: 24, opacity: 0.7 },
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
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceTint,
  },
  backText: { color: theme.colors.textMuted, fontSize: 16 },
  headerTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '600' },
  brandHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  brandIcon: { fontSize: 36 },
  brandTitle: { color: theme.colors.primaryText, fontSize: 28, fontWeight: '700', marginTop: 6 },
  brandTagline: { color: theme.colors.textMuted, fontSize: 14, marginTop: 4 },
  profileHero: { alignItems: 'center', paddingVertical: 12 },
  profileTitle: { color: theme.colors.primaryText, fontSize: 28, fontWeight: '800', marginTop: 12 },
  profileTagline: { color: theme.colors.textMuted, fontSize: 14, marginTop: 6 },
  emojiCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', shadowColor: theme.colors.shadow, shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14 },
  emojiIcon: { fontSize: 40 },
  progressSection: { alignItems: 'center', paddingTop: 12, paddingBottom: 12 },
  progressHeader: { color: theme.colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  progressRing: { width: 200, height: 200, borderRadius: 100, borderWidth: 14, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  progressRingContent: { alignItems: 'center', justifyContent: 'center' },
  progressRingValue: { color: theme.colors.text, fontSize: 24, fontWeight: '800' },
  progressRingSub: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
  progressLabel: { color: theme.colors.textMuted, fontSize: 16, marginTop: 12 },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  panel: { backgroundColor: theme.colors.surface, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, padding: 16, shadowColor: theme.colors.shadow, shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14 },
  heroTitle: { color: theme.colors.text, fontSize: 32, fontWeight: '800', marginBottom: 10 },
  streakLabel: { color: theme.colors.textMuted, fontSize: 13 },
  zoneCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
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
  zoneHeaderTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700', flex: 1 },
  zoneChevron: { color: theme.colors.textMuted, fontSize: 22, transform: [{ rotate: '0deg' }] },
  zoneChevronOpen: { transform: [{ rotate: '90deg' }] },
  subcategoriesList: { paddingHorizontal: 14, paddingBottom: 12 },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 260,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    marginBottom: 10,
  },
  deckBadge: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  deckTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  deckSubtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  chevron: { color: theme.colors.textMuted, fontSize: 24, marginLeft: 12 },
  footerNote: { paddingHorizontal: 16, paddingTop: 8 },
  footerText: { color: theme.colors.textMuted, fontSize: 13 },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    minHeight: 220,
    justifyContent: 'center',
    maxWidth: 640,
    alignSelf: 'center',
  },
  cardPrompt: { color: theme.colors.text, fontSize: 20, lineHeight: 28 },
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
    backgroundColor: theme.colors.surfaceTint,
    alignItems: 'center',
  },
  primaryBtn: {},
  controlText: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  progress: { alignItems: 'center', marginTop: 8 },
  deckStack: { minHeight: 280, position: 'relative', marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  stackInner: { width: '100%', maxWidth: 640, marginHorizontal: 16, alignSelf: 'center', position: 'relative', minHeight: 240 },
  progressText: { color: theme.colors.textMuted, fontSize: 13 },
  favButton: { paddingHorizontal: 10, paddingVertical: 6 },
  favStar: { fontSize: 22, textShadowColor: '#B388FF', textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } },
  favStarActive: { color: theme.colors.primaryText, textShadowRadius: 14 },
  cardFavButton: { position: 'absolute', right: 12, top: 12, padding: 4 },
  cardFavStar: { fontSize: 22, textShadowColor: '#B388FF', textShadowRadius: 8 },
  cardFavStarActive: { color: theme.colors.primaryText, textShadowRadius: 12 },
  tileRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 12 },
  statTile: { flex: 1, marginRight: 8, backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 12, paddingHorizontal: 12, shadowColor: theme.colors.shadow, shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
  statTileHeader: { flexDirection: 'row', alignItems: 'center' },
  statTileIcon: { fontSize: 18, marginRight: 8 },
  statTileLabel: { color: theme.colors.textMuted, fontSize: 13 },
  statTileValue: { color: theme.colors.primaryText, fontSize: 24, fontWeight: '800', marginTop: 6 },
  moodOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  moodCard: {
    width: '92%',
    maxWidth: 560,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  moodTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  moodSubtitle: { color: theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 6 },
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
    backgroundColor: theme.colors.surfaceTint,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { color: theme.colors.text, fontSize: 14, marginTop: 6 },
  moodHint: { color: theme.colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    zIndex: 100,
  },
  navItem: { alignItems: 'center', paddingHorizontal: 6, position: 'relative' },
  navItemActive: { },
  navIcon: { fontSize: 18 },
  navLabel: { color: theme.colors.textMuted, fontSize: 12 },
  navLabelActive: { color: theme.colors.primaryText, fontWeight: '700' },
  navBadge: { position: 'absolute', top: -2, right: 6, backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  navBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  dailyCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  dailyTitle: { color: theme.colors.primaryText, fontSize: 16, fontWeight: '700' },
  dailyPrompt: { color: theme.colors.text, fontSize: 16, marginTop: 6 },
  answerBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  answerText: { color: '#fff', fontWeight: '700' },
  favoriteCategoryCard: { padding: 14, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12 },
  favoriteHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  favoriteCountBadge: { marginLeft: 8, backgroundColor: theme.colors.surfaceTint, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  favoriteCountText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700' },
  favoriteQuestionsList: { marginTop: 10 },
  favoriteItemRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  favoriteQuestion: { color: theme.colors.text, fontSize: 16, flex: 1, marginRight: 12 },
  favoriteActions: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  favoriteOpenBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center' },
  removeBtn: { marginLeft: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: theme.colors.surfaceTint },
  removeText: { color: theme.colors.text },
  themeRow: { flexDirection: 'row', marginTop: 10 },
  themeBtn: { marginRight: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, backgroundColor: theme.colors.surfaceTint },
  themeBtnActive: { borderWidth: 1, borderColor: theme.colors.border },
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.surfaceTint, alignItems: 'center', justifyContent: 'center' },
  profileGreeting: { color: theme.colors.primaryText, fontSize: 22, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  statCard: { flex: 1, marginRight: 8, padding: 14, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  statLabel: { color: theme.colors.textMuted, fontSize: 13 },
  statValue: { color: theme.colors.primaryText, fontSize: 22, fontWeight: '800', marginTop: 6 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 8, marginBottom: 6 },
  viewAllLink: { color: theme.colors.textMuted, fontSize: 13 },
  favoritePreviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginHorizontal: 16, marginBottom: 8 },
  favoriteDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.primary, marginRight: 10 },
  favoritePreviewText: { color: theme.colors.text, fontSize: 16, flex: 1 },
  highlightsRow: { flexDirection: 'row', marginTop: 10 },
  chip: { backgroundColor: theme.colors.surfaceTint, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  chipText: { color: theme.colors.textMuted, fontSize: 13, fontWeight: '700' },
  chipFilterRow: { flexDirection: 'row', marginTop: 6, marginBottom: 12 },
  chipSelected: { borderWidth: 1, borderColor: theme.colors.border },
  chipTextSelected: { color: theme.colors.text },
  highlightText: { color: theme.colors.text, fontSize: 16, marginTop: 10 },
  highlightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 12, paddingHorizontal: 12, shadowColor: theme.colors.shadow, shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, marginBottom: 12 },
  highlightIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surfaceTint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  highlightIcon: { fontSize: 20 },
  highlightTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  highlightSubtitle: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
  formRow: { marginTop: 12 },
  formLabel: { color: theme.colors.textMuted, fontSize: 13, marginBottom: 6 },
  input: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.colors.surfaceTint, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap' },
  genderBtn: { marginRight: 8, marginBottom: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.colors.surfaceTint },
  genderBtnActive: { borderWidth: 1, borderColor: theme.colors.border },
  genderBtnText: { color: theme.colors.text },
  listCard: { backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.colors.shadow, shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, marginBottom: 12 },
  listItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  listIconI: { marginRight: 12 },
  listItemText: { color: theme.colors.text, fontSize: 16, flex: 1 },
  listChevron: { color: theme.colors.textMuted, fontSize: 22 },
  searchRow: { marginTop: 12, marginBottom: 16 },
  searchInput: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.colors.surfaceTint, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  statTileIconI: { marginRight: 8 },
});
