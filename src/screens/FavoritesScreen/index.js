import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Header } from '../../navigation/Header';
import { useTheme } from '../../contexts/ThemeContext';

export function FavoritesScreen({ items, onOpen, onRemove, onBack, onShareQuestion, onToggleRead }) {
  const { theme } = useTheme();
  const grouped = React.useMemo(() => {
    if (!Array.isArray(items)) return [];
    const map = {};
    for (const f of items) {
      if (!f || typeof f !== 'object') continue;
      if (!map[f.categoryId]) map[f.categoryId] = { categoryId: f.categoryId, categoryName: f.categoryName || 'Unknown', color: f.color || '#9D4EDD', questions: [] };
      map[f.categoryId].questions.push({
        text: f.question || 'No question text',
        read: !!f.read,
      });
    }
    return Object.values(map);
  }, [items]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Header title="Favorites" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {grouped.length === 0 ? (
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>No favorites yet. Add from any card.</Text>
        ) : (
          grouped.map((g) => (
            <View key={g.categoryId} style={[styles.favoriteCategoryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.favoriteHeaderRow}>
                <View style={[styles.zoneBadge, { backgroundColor: g.color }]} />
                <Text style={[styles.zoneHeaderTitle, { color: theme.colors.text }]}>{g.categoryName}</Text>
                <View style={[styles.favoriteCountBadge, { backgroundColor: theme.colors.surfaceTint }]}><Text style={[styles.favoriteCountText, { color: theme.colors.textMuted }]}>{g.questions.length}</Text></View>
              </View>
              <View style={styles.favoriteQuestionsList}>
                {g.questions.map((q, i) => (
                  <View key={`${g.categoryId}-${i}`} style={styles.favoriteItemRow}>
                    <Text style={[styles.favoriteQuestion, { color: theme.colors.text }]}>{q.text}</Text>
                    <View style={styles.favoriteActions}>
                      <TouchableOpacity
                        style={[styles.favoriteOpenBtn, { backgroundColor: q.read ? '#8343b1ff' : '#E6D6FF' }]}
                        onPress={() => onToggleRead && onToggleRead({ categoryId: g.categoryId, question: q.text, read: !q.read })}
                      >
                        <Text style={[styles.answerText, { color: q.read ? '#FFFFFF' : '#8343b1ff' }]}>{q.read ? 'Read' : 'Unread'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.shareBtn, { backgroundColor: theme.colors.surfaceTint }]} onPress={() => onShareQuestion && onShareQuestion(`${g.categoryName}: ${q.text}`)}>
                        <Text style={[styles.shareText, { color: theme.colors.text }]}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.removeBtn, { backgroundColor: theme.colors.surfaceTint }]} onPress={() => onRemove({ categoryId: g.categoryId, question: q.text })}>
                        <Text style={[styles.removeText, { color: theme.colors.text }]}>Remove</Text>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  footerText: { color: '#7A6FA3', fontSize: 13 },
  favoriteCategoryCard: { padding: 14, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E6D6FF', marginBottom: 12 },
  favoriteHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  zoneBadge: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  zoneHeaderTitle: { color: '#2F2752', fontSize: 18, fontWeight: '700', flex: 1 },
  favoriteCountBadge: { marginLeft: 8, backgroundColor: '#F5EEFF', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  favoriteCountText: { color: '#7A6FA3', fontSize: 12, fontWeight: '700' },
  favoriteQuestionsList: { marginTop: 10 },
  favoriteItemRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  favoriteQuestion: { color: '#2F2752', fontSize: 16, flex: 1, marginRight: 12 },
  favoriteActions: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  favoriteOpenBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center' },
  answerText: { 
    color: '#fff', 
    fontWeight: '700' 
  },
  shareBtn: { marginLeft: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F5EEFF' },
  shareText: { color: '#2F2752' },
  removeBtn: { marginLeft: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#F5EEFF' },
  removeText: { color: '#2F2752' },
});
