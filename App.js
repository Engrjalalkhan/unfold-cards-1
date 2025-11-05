import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { decks } from './data/decks';

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

function DeckCard({ deck, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.deckCard, { borderColor: deck.color }]}> 
      <View style={[styles.deckBadge, { backgroundColor: deck.color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.deckTitle}>{deck.name}</Text>
        <Text style={styles.deckSubtitle}>{deck.questions.length} questions</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function HomeScreen({ onSelectDeck }) {
  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Unflod Cards" />
      <Text style={styles.sectionTitle}>Choose a deck</Text>
      <FlatList
        data={decks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <DeckCard deck={item} onPress={() => onSelectDeck(item)} />
        )}
      />
      <View style={styles.footerNote}>
        <Text style={styles.footerText}>Deepen connection through questions — for couples, friends, family, or anyone.</Text>
      </View>
    </SafeAreaView>
  );
}

function CardScreen({ deck, onBack }) {
  const [index, setIndex] = React.useState(0);
  const [order, setOrder] = React.useState([...deck.questions.map((_, i) => i)]);

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

  const q = deck.questions[order[index]];

  return (
    <SafeAreaView style={styles.screen}>
      <Header title={deck.name} onBack={onBack} />
      <View style={[styles.card, { borderColor: deck.color }]}> 
        <Text style={styles.cardPrompt}>{q}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={goPrev}>
          <Text style={styles.controlText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.primaryBtn, { backgroundColor: deck.color }]} onPress={goNext}>
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

  if (!selected) {
    return <HomeScreen onSelectDeck={(d) => setSelected(d)} />;
  }

  return <CardScreen deck={selected} onBack={() => setSelected(null)} />;
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
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#111820',
    borderWidth: 2,
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
});
