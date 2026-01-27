import React from 'react';
import { StyleSheet, Animated, View, Dimensions } from 'react-native';

function Particle({ seed }) {
  const { size, startX, startY, driftX, driftY, duration, color, baseOpacity } = seed;
  const x = React.useRef(new Animated.Value(startX)).current;
  const y = React.useRef(new Animated.Value(startY)).current;
  const opacity = React.useRef(new Animated.Value(baseOpacity)).current;
  const scale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(x, { toValue: startX + driftX, duration, useNativeDriver: true }),
          Animated.timing(y, { toValue: startY + driftY, duration, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: baseOpacity + 0.25, duration, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.08, duration, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(x, { toValue: startX - driftX, duration, useNativeDriver: true }),
          Animated.timing(y, { toValue: startY - driftY, duration, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: baseOpacity, duration, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [x, y, opacity, scale, startX, startY, driftX, driftY, duration, baseOpacity]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ translateX: x }, { translateY: y }, { scale }],
        opacity,
        shadowColor: '#CBB2FF',
        shadowOpacity: 0.6,
        shadowRadius: 16,
      }}
    />
  );
}

export function SoftParticles({ theme }) {
  const { width, height } = Dimensions.get('window');
  const palette = theme?.name === 'dark'
    ? ['rgba(157,78,221,0.12)', 'rgba(201,179,255,0.10)', 'rgba(233,215,255,0.08)']
    : ['rgba(157,78,221,0.15)', 'rgba(201,179,255,0.12)', 'rgba(233,215,255,0.10)'];
  const seeds = React.useMemo(() => {
    const n = 14;
    return Array.from({ length: n }).map(() => {
      const size = 10 + Math.floor(Math.random() * 16); // 10–26px
      const startX = Math.random() * width;
      const startY = Math.random() * (height * 0.8);
      const driftX = 12 + Math.random() * 24;
      const driftY = 10 + Math.random() * 22;
      const duration = 4000 + Math.floor(Math.random() * 3000);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const baseOpacity = 0.18 + Math.random() * 0.18; // 0.18–0.36
      return { size, startX, startY, driftX, driftY, duration, color, baseOpacity };
    });
  }, [width, height]);

  return (
    <View pointerEvents="none" style={styles.particlesLayer}>
      {seeds.map((seed, i) => (
        <Particle key={i} seed={seed} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particlesLayer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
});
