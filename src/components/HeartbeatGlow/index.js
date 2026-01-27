import React from 'react';
import { StyleSheet, Animated, View } from 'react-native';

export function HeartbeatGlow({ size = 60, duration = 2000 }) {
  const progress = React.useRef(new Animated.Value(0)).current;
  const base = size; // square container
  const spread = 40; // total diameter increase to simulate 20px around radius
  const scaleTo = (base + spread) / base;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      })
    ).start();
  }, [duration]);

  const layer = (color, baseOpacity, extraScale = 0) => ({
    backgroundColor: color,
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [baseOpacity, 0] }),
    transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1 + extraScale, scaleTo + extraScale] }) }],
  });

  return (
    <View style={{ position: 'absolute', left: 0, top: 0, width: base, height: base }} pointerEvents="none">
      <Animated.View style={[styles.glowCircle, { width: base, height: base, borderRadius: base / 2 }, layer('#8A4DFF', 1.0, 0)]} />
      <Animated.View style={[styles.glowCircle, { width: base, height: base, borderRadius: base / 2 }, layer('#A26BFF', 0.6, 0.05)]} />
      <Animated.View style={[styles.glowCircle, { width: base, height: base, borderRadius: base / 2 }, layer('#C295FF', 0.3, 0.10)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glowCircle: { position: 'absolute', left: 0, top: 0 },
});
