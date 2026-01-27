import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const HighlightCard = React.memo(function HighlightCard({ icon, title, subtitle }) {
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

const styles = StyleSheet.create({
  highlightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E6D6FF', paddingVertical: 12, paddingHorizontal: 12, shadowColor: 'rgba(124,77,255,0.18)', shadowOpacity: 0.22, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, marginBottom: 12 },
  highlightIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5EEFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  highlightIcon: { fontSize: 20 },
  highlightTitle: { color: '#2F2752', fontSize: 16, fontWeight: '700' },
  highlightSubtitle: { color: '#7A6FA3', fontSize: 13, marginTop: 2 },
  chevron: { color: '#7A6FA3', fontSize: 24, marginLeft: 12 },
});
