import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { zones } from './data/decks';

function Header({ title, onBack }) {
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
      <View style={{ width: 64 }} />
    </View>
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
    <View style={{ marginBottom: 24 }}>
      <Text style={[styles.sectionTitle, { color: zone.color }]}>{zone.name}</Text>
      <FlatList
        data={zone.categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => (
          <CategoryCard category={item} onPress={() => onSelectCategory(item)} />
        )}
      />
    </View>
  );
}

function HomeScreen({ onSelectCategory }) {
  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Unflod Cards" />
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {zones.map((zone) => (
          <ZoneSection key={zone.id} zone={zone} onSelectCategory={onSelectCategory} />
        ))}
      </ScrollView>
      <View style={styles.footerNote}>
        <Text style={styles.footerText}>Deepen connection through questions — for couples, friends, family, or anyone.</Text>
      </View>
    </SafeAreaView>
  );
}

function CardScreen({ category, onBack }) {
  const [index, setIndex] = React.useState(0);
  const [order, setOrder] = React.useState([...category.questions.map((_, i) => i)]);

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

  return (
    <SafeAreaView style={styles.screen}>
      <Header title={category.name} onBack={onBack} />
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

export default function App() {
  const [selected, setSelected] = React.useState(null);
  const [showMood, setShowMood] = React.useState(true);
  const [mood, setMood] = React.useState(null);

  const handleSelectMood = (m) => {
    setMood(m);
    setShowMood(false);
  };

  const Screen = !selected ? (
    <HomeScreen onSelectCategory={(c) => setSelected(c)} />
  ) : (
    <CardScreen category={selected} onBack={() => setSelected(null)} />
  );

  return (
    <View style={{ flex: 1 }}>
      {Screen}
      {showMood && <MoodMeter onSelect={handleSelectMood} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F141A',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backText: { color: '#C9D1D9', fontSize: 16 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  sectionTitle: {
    color: '#C9D1D9',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#111820',
    borderWidth: 2,
    minWidth: 260,
  },
  deckBadge: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  deckTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  deckSubtitle: { color: '#8B949E', fontSize: 13, marginTop: 2 },
  chevron: { color: '#8B949E', fontSize: 24, marginLeft: 12 },
  footerNote: { paddingHorizontal: 16, paddingTop: 8 },
  footerText: { color: '#8B949E', fontSize: 13 },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#111820',
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    minHeight: 220,
    justifyContent: 'center',
  },
  cardPrompt: { color: '#FFFFFF', fontSize: 20, lineHeight: 28 },
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  primaryBtn: {},
  controlText: { color: '#C9D1D9', fontSize: 16, fontWeight: '500' },
  primaryText: { color: '#0F141A', fontWeight: '700' },
  progress: { alignItems: 'center', marginTop: 8 },
  progressText: { color: '#8B949E', fontSize: 13 },
  moodOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  moodCard: {
    width: '92%',
    maxWidth: 560,
    backgroundColor: '#111820',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#2A2F36',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  moodTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  moodSubtitle: { color: '#8B949E', fontSize: 14, textAlign: 'center', marginTop: 6 },
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
    backgroundColor: '#0F141A',
    borderWidth: 1,
    borderColor: '#2A2F36',
    alignItems: 'center',
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { color: '#C9D1D9', fontSize: 14, marginTop: 6 },
  moodHint: { color: '#8B949E', fontSize: 12, textAlign: 'center', marginTop: 8 },
});
