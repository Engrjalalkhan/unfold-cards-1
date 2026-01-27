import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SoftParticles } from '../../components/SoftParticles';

export function OnboardingScreen({ onContinue, theme }) {
  const pulse = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const floating = [
    { emoji: '💜', style: { top: 120, left: 24 } },
    { emoji: '💕', style: { top: 220, right: 32 } },
    { emoji: '💖', style: { top: 320, left: 48 } },
  ];

  return (
    <LinearGradient colors={theme.gradients.onboarding} style={styles.onboardingContainer}>
      <SoftParticles theme={theme} />
      <View style={styles.onboardingContent}>
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoImage} />
        </Animated.View>
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

const styles = StyleSheet.create({
  onboardingContainer: { flex: 1, justifyContent: 'center' },
  onboardingContent: { alignItems: 'center', paddingHorizontal: 24 },
  logoImage: { 
    width: 120, 
    height: 120, 
    resizeMode: 'contain',
    marginBottom: 16,
  },
  onboardingTitle: { color: '#3B245A', fontSize: 32, fontWeight: '800', marginTop: 8 },
  onboardingTagline: { color: '#6B4C9A', fontSize: 16, marginTop: 6 },
  floatingIcon: { position: 'absolute', fontSize: 24, opacity: 0.7 },
  ctaButton: { marginTop: 28, borderRadius: 18, overflow: 'hidden' },
  ctaGradient: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 18 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  guestLinkBtn: { marginTop: 10 },
  guestLink: { color: '#6B4C9A', fontSize: 14 },
});
