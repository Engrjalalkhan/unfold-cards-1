import React from 'react';
import { StyleSheet, Animated, View, Text } from 'react-native';

export function ProgressRing({ size = 200, thickness = 14, progress = 0, trackColor, progressColor, children, animatedProgress, theme }) {
  const clamped = Math.max(0, Math.min(1, progress || 0));
  const internalAnim = React.useRef(new Animated.Value(clamped)).current;
  const anim = animatedProgress || internalAnim;

  React.useEffect(() => {
    if (!animatedProgress) {
      Animated.timing(internalAnim, {
        toValue: clamped,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }
  }, [clamped, animatedProgress]);

  const rightRotate = anim.interpolate({
    inputRange: [0, 0.5],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });
  const leftRotate = anim.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });
  const leftOpacity = anim.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: [0, 0, 1, 1],
  });

  const half = size / 2;

  return (
    <View style={[{
      width: size, 
      height: size, 
      alignItems: 'center', 
      justifyContent: 'center', 
      position: 'relative',
      // Shadow for the container
      shadowColor: '#7A6FA3',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    }]}>
      {/* Track ring behind */}
      <View style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: thickness,
        borderColor: trackColor,
        backgroundColor: theme?.isDark ? '#000000' : '#FFFFFF',
        shadowColor: theme?.isDark ? '#000' : '#7A6FA3',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: theme?.isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      }} />
      {/* Right half progress */}
      <View style={{ position: 'absolute', left: half, top: 0, width: half, height: size, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', left: -half, top: 0, width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: progressColor, transform: [{ rotate: '-90deg' }, { rotate: rightRotate }] }} />
      </View>
      {/* Left half progress */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: half, height: size, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: size / 2, borderWidth: thickness, borderColor: progressColor, opacity: leftOpacity, transform: [{ rotate: '-90deg' }, { rotate: leftRotate }] }} />
      </View>

      <View style={styles.progressRingContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRingContent: { alignItems: 'center', justifyContent: 'center' },
});
