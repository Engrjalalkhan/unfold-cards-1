import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { Header } from '../../navigation/Header';
import { allSubcategories } from '../../data/decks';
import { useTheme } from '../../contexts/ThemeContext';

export function ShuffleScreen({ onOpen, onBack, onShareQuestion }) {
  const { theme } = useTheme();
  const [pick, setPick] = React.useState(() => randomPick());
  function randomPick() {
    if (!allSubcategories || allSubcategories.length === 0) {
      return { category: null, index: 0, question: 'No categories available' };
    }
    const c = allSubcategories[Math.floor(Math.random() * allSubcategories.length)];
    if (!c || !Array.isArray(c.questions) || c.questions.length === 0) {
      return { category: c, index: 0, question: 'No questions available' };
    }
    const qi = Math.floor(Math.random() * c.questions.length);
    return { category: c, index: qi, question: c.questions[qi] };
  }
  const reroll = () => setPick(randomPick());
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title="Shuffle" onBack={onBack} />
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text style={[styles.cardPrompt, { color: theme.colors.text }]}>{pick.question}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceTint }]} onPress={reroll}>
          <Text style={[styles.controlText, { color: theme.colors.text }]}>
            Another
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceTint }]} onPress={() => onShareQuestion && onShareQuestion(`${pick.category?.name || 'Unknown'}: ${pick.question}`)}>
          <Text style={[styles.controlText, { color: theme.colors.text }]}>
            Share
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.primaryBtn, { backgroundColor: pick.category?.color || '#9D4EDD' }]} onPress={() => onOpen(pick.category, pick.index)}>
          <Text style={[styles.controlText, styles.primaryText]}>Open Category</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
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
});
