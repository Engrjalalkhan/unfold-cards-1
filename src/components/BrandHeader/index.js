import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeartbeatGlow } from '../HeartbeatGlow';

export function BrandHeader({ theme }) {
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

const styles = StyleSheet.create({
  brandHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  brandLogoWrap: { position: 'relative', width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  brandIcon: { fontSize: 36 },
  brandTitle: { color: '#3B245A', fontSize: 28, fontWeight: '700', marginTop: 6 },
  brandTagline: { color: '#6B4C9A', fontSize: 14, marginTop: 4 },
});
