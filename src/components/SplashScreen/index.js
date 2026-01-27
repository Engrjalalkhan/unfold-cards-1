import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onAnimationComplete }) => {
  const scaleValue = useRef(new Animated.Value(0.8)).current;
  const waveScale1 = useRef(new Animated.Value(1)).current;
  const waveOpacity1 = useRef(new Animated.Value(1)).current;
  const waveScale2 = useRef(new Animated.Value(1)).current;
  const waveOpacity2 = useRef(new Animated.Value(1)).current;
  const waveScale3 = useRef(new Animated.Value(1)).current;
  const waveOpacity3 = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Reset all animations
    waveScale1.setValue(1);
    waveOpacity1.setValue(0.7);
    waveScale2.setValue(1);
    waveOpacity2.setValue(0.7);
    waveScale3.setValue(1);
    waveOpacity3.setValue(0.7);
    
    // Animation settings - Slower and more fluid
    const WAVE_DURATION = 2000; // Reduced duration for faster splash
    const WAVE_SCALE = 1.8; // Reduced scale to keep waves closer to the logo
    
    // Create wave animation
    const createWaveAnimation = (scale, opacity, delay = 0) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: WAVE_SCALE,
            duration: WAVE_DURATION,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: WAVE_DURATION,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic)
          })
        ])
      ]);
    };
    
    // Start the animations with staggered delays
    const WAVE_DELAY = 300; // Reduced delay between waves for faster splash
    const waveAnimation = Animated.stagger(WAVE_DELAY, [
      createWaveAnimation(waveScale1, waveOpacity1, 0),
      createWaveAnimation(waveScale2, waveOpacity2, WAVE_DELAY),
      createWaveAnimation(waveScale3, waveOpacity3, WAVE_DELAY * 2)
    ]);

    // Start the logo pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.timing(scaleValue, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        })
      ])
    );

    // Start all animations
    const animation = Animated.parallel([
      waveAnimation,
      pulseAnimation
    ]);

    // Start the animation
    animation.start();
    
    // Set a timeout to hide the splash screen after the animation completes
    const timer = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 3000); // Hide after 3 seconds
    
    // Cleanup function
    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [onAnimationComplete]);

  const renderWave = (scale, opacity) => (
    <Animated.View 
      style={[
        styles.wave, 
        {
          transform: [{ scale }],
          opacity,
          borderColor: 'rgba(142, 68, 173, 0.6)', // Purple color
          borderWidth: 1.5,
          borderRadius: 100,
        }
      ]} 
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.waveContainer}>
        {renderWave(waveScale1, waveOpacity1)}
        {renderWave(waveScale2, waveOpacity2)}
        {renderWave(waveScale3, waveOpacity3)}
      </View>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8D5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveContainer: {
    position: 'absolute',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 120, // Slightly larger to accommodate the wave effect
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(42, 10, 56, 0.1)', // Subtle purple background
    borderWidth: 5,
    borderColor: 'rgba(69, 2, 97, 0.6)',
    shadowColor: '#6565c8ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  logoContainer: {
    position: 'relative',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
});

export default SplashScreen;
