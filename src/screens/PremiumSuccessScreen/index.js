import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const FEATURES = [
  {
    icon: 'heart',
    title: 'All categories unlocked',
    subtitle: 'Explore everything',
  },
  {
    icon: 'chatbubbles',
    title: 'Unlimited questions',
    subtitle: 'No limits, all yours',
  },
  {
    icon: 'flame',
    title: 'Premium content',
    subtitle: 'Spicy, deep & exclusive',
  },
  {
    icon: 'close-circle',
    title: 'No ads',
    subtitle: 'Enjoy a clean experience',
  },
  {
    icon: 'sparkles',
    title: 'New questions weekly',
    subtitle: 'Fresh & exciting every time',
  },
];

export function PremiumSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const openCustomZone = route.params?.openCustomZone ?? false;

  const handleStartExploring = () => {
    navigation.navigate('Home', {
      openCustomZone,
      premiumWelcome: true,
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0f0c29', '#1a1240', '#24243e']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.crownWrap}>
              <Text style={styles.crownEmoji}>👑</Text>
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </View>
            </View>

            <Text style={styles.titleLine}>You're Now</Text>
            <Text style={styles.titlePremium}>Premium! 🎉</Text>
            <Text style={styles.subtitle}>Welcome to unlimited conversations!</Text>
          </View>

          <View style={styles.featuresCard}>
            {FEATURES.map((item, index) => (
              <View
                key={item.title}
                style={[
                  styles.featureRow,
                  index < FEATURES.length - 1 && styles.featureRowBorder,
                ]}
              >
                <View style={styles.featureIconWrap}>
                  <Ionicons name={item.icon} size={20} color="#fff" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleStartExploring}
            style={styles.ctaTouch}
          >
            <LinearGradient
              colors={['#7C3AED', '#A855F7', '#F97316']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.ctaGradient}
            >
              <Ionicons name="rocket" size={22} color="#fff" style={styles.ctaIcon} />
              <Text style={styles.ctaText}>Start Exploring</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footerLine}>Your subscription is active ✅</Text>
          <Text style={styles.footerThanks}>Thank you for upgrading! 💜</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  crownWrap: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownEmoji: {
    fontSize: 72,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#1a1240',
  },
  titleLine: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  titlePremium: {
    fontSize: 34,
    fontWeight: '800',
    color: '#F472B6',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  featuresCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  featureSubtitle: {
    fontSize: 13,
    color: 'rgba(147,197,253,0.9)',
    marginTop: 2,
  },
  ctaTouch: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  ctaIcon: {
    marginRight: 10,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerLine: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  footerThanks: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 6,
  },
});
