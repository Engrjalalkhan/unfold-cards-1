import { StatusBar } from 'expo-status-bar';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ScrollView, LayoutAnimation, Platform, UIManager, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { zones } from './data/decks';
import { theme } from './theme';
import { allCategories } from './data/decks';

const FAVORITES_STORAGE_KEY = '@unflod_cards:favorites:v1';
const ONBOARDING_STORAGE_KEY = '@unflod_cards:onboarding_done:v1';

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
    </View>
  );
}

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

        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
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
  return (
    <TouchableOpacity onPress={onPress} style={[styles.categoryCard, { borderColor: category.color }]}> 
      <View style={[styles.deckBadge, { backgroundColor: category.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.deckTitle}>{category.name}</Text>
        <Text style={styles.deckSubtitle}>{category.questions.length} questions</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
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
  // Deterministic pick based on date
  const seed = new Date().toDateString().length;
  const idx = seed % allCategories.length;
  const category = allCategories[idx];
  const qIndex = seed % category.questions.length;
  const question = category.questions[qIndex];
  return (
    <View style={styles.dailyCard}>
      <Text style={styles.dailyTitle}>Question of the Day 💭</Text>
      <Text style={styles.dailyPrompt}>{question}</Text>
      <TouchableOpacity style={[styles.answerBtn, { backgroundColor: category.color }]} onPress={() => onAnswer(category, qIndex)}>
        <Text style={styles.answerText}>Answer Now</Text>
      </TouchableOpacity>
    </View>
  );
}

function HomeScreen({ onSelectCategory, onAnswerDaily }) {
  const [expandedZoneId, setExpandedZoneId] = React.useState(null);

  React.useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleZone = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedZoneId((prev) => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.screen}>
      <BrandHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}>
        {zones.map((zone) => {
          const expanded = expandedZoneId === zone.id;
          return (
            <View key={zone.id} style={styles.zoneCard}>
              <TouchableOpacity style={styles.zoneHeaderRow} onPress={() => toggleZone(zone.id)}>
                <View style={[styles.zoneBadge, { backgroundColor: zone.color }]} />
                <Text style={styles.zoneHeaderTitle}>{zone.name}</Text>
                <Text style={[styles.zoneChevron, expanded && styles.zoneChevronOpen]}>›</Text>
              </TouchableOpacity>
              {expanded && (
                <View style={styles.subcategoriesList}>
                  {zone.categories.map((item) => (
                    <TouchableOpacity key={item.id} onPress={() => onSelectCategory(item)} style={[styles.categoryCard, { borderColor: theme.colors.border }]}> 
                      <View style={[styles.deckBadge, { backgroundColor: item.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deckTitle}>{item.name}</Text>
                        <Text style={styles.deckSubtitle}>{item.questions.length} questions</Text>
                      </View>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        <DailyQuestion onAnswer={onAnswerDaily} />
      </ScrollView>
      <View style={styles.footerNote}>
        <Text style={styles.footerText}>Deepen connection through questions — for couples, friends, family, or anyone.</Text>
      </View>
    </SafeAreaView>
  );
}

function CardScreen({ category, onBack, onToggleFavorite, isFavorite, initialIndex = 0 }) {
  const [index, setIndex] = React.useState(0);
  const [order, setOrder] = React.useState([...category.questions.map((_, i) => i)]);

  React.useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  const goNext = () => setIndex((prev) => (prev + 1) % order.length);
  const goPrev = () => setIndex((prev) => (prev - 1 + order.length) % order.length);
  const shuffle = () => {
    const arr = [...order];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setIndex(0);
  };

  const q = category.questions[order[index]];

  const favActive = isFavorite(category.id, q);
  const right = (
    <TouchableOpacity onPress={() => onToggleFavorite(category, q)} style={styles.favButton}>
      <Text style={[styles.favStar, favActive && styles.favStarActive]}>⭐</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <Header title={category.name} onBack={onBack} right={right} />
      <View style={[styles.card, { borderColor: category.color }]}> 
        <Text style={styles.cardPrompt}>{q}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={goPrev}>
          <Text style={styles.controlText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.primaryBtn, { backgroundColor: category.color }]} onPress={goNext}>
          <Text style={[styles.controlText, styles.primaryText]}>Next</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={shuffle}>
          <Text style={styles.controlText}>Shuffle</Text>
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

function ProfileScreen({ mode, setMode }) {
  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Profile" />
      <View style={{ padding: 16 }}>
        <Text style={styles.deckTitle}>Theme</Text>
        <View style={styles.themeRow}>
          {['light','gradient'].map((m) => (
            <TouchableOpacity key={m} style={[styles.themeBtn, mode===m && styles.themeBtnActive]} onPress={() => setMode(m)}>
              <Text style={[styles.controlText]}>{m[0].toUpperCase()+m.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

function BottomNav({ current, onNavigate, favoritesCount }) {
  const item = (key, label, emoji, count = 0) => (
    <TouchableOpacity style={[styles.navItem, current===key && styles.navItemActive]} onPress={() => onNavigate(key)}>
      <Text style={styles.navEmoji}>{emoji}</Text>
      {key === 'favorites' && count > 0 && (
        <View style={styles.navBadge}><Text style={styles.navBadgeText}>{count}</Text></View>
      )}
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );
  return (
    <View style={styles.bottomNav}>
      {item('home','Home','🏠')}
      {item('favorites','Favorites','⭐', favoritesCount)}
      {item('shuffle','Shuffle','🎲')}
      {item('profile','Profile','👤')}
    </View>
  );
}

export default function App() {
  const [selected, setSelected] = React.useState(null);
  const [showMood, setShowMood] = React.useState(true);
  const [mood, setMood] = React.useState(null);
  const [favorites, setFavorites] = React.useState([]);
  const [tab, setTab] = React.useState('home');
  const [uiMode, setUiMode] = React.useState('light');
  const [initialIndex, setInitialIndex] = React.useState(0);
  const [hasHydratedFavorites, setHasHydratedFavorites] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(true);

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

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'done');
    } catch {}
    setShowOnboarding(false);
  };

  const handleSelectMood = (m) => {
    setMood(m);
    setShowMood(false);
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

  let Screen;
  if (selected) {
    Screen = (
      <CardScreen
        category={selected}
        initialIndex={initialIndex}
        onBack={() => setSelected(null)}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
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
        <ShuffleScreen onOpen={openCategoryAt} />
      );
    } else if (tab === 'profile') {
      Screen = (
        <ProfileScreen mode={uiMode} setMode={setUiMode} />
      );
    } else {
      Screen = (
        <HomeScreen onSelectCategory={(c) => setSelected(c)} onAnswerDaily={(cat, idx) => openCategoryAt(cat, idx)} />
      );
    }
  }

  const navigate = (key) => {
    setSelected(null);
    setTab(key);
  };

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

  if (uiMode === 'gradient') {
    return (
      <LinearGradient colors={[theme.colors.surfaceTint, theme.colors.background]} style={{ flex: 1 }}>
        {Root}
      </LinearGradient>
    );
  }
  return Root;
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
  dotsContainer: { position: 'absolute', bottom: 36, width: '100%', flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D7C4F3', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#9D4EDD' },
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
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
  progressText: { color: theme.colors.textMuted, fontSize: 13 },
  favButton: { paddingHorizontal: 10, paddingVertical: 6 },
  favStar: { fontSize: 22, textShadowColor: '#B388FF', textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } },
  favStarActive: { color: theme.colors.primaryText, textShadowRadius: 14 },
  cardFavButton: { position: 'absolute', right: 12, top: 12, padding: 4 },
  cardFavStar: { fontSize: 22, textShadowColor: '#B388FF', textShadowRadius: 8 },
  cardFavStarActive: { color: theme.colors.primaryText, textShadowRadius: 12 },
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
  navEmoji: { fontSize: 18 },
  navLabel: { color: theme.colors.textMuted, fontSize: 12 },
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
});
