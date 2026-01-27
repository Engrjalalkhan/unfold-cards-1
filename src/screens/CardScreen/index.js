import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { hexToRgba } from '../../utils/helpers';
import { Header } from '../../navigation/Header';

export function CardScreen({ category, onBack, onToggleFavorite, isFavorite, initialIndex = 0, onViewedCard, onShareQuestion, theme }) {
  // Defensive: ensure category exists and has questions
  if (!category || typeof category !== 'object' || !Array.isArray(category.questions)) {
    return (
      <SafeAreaView style={styles.screen}>
        <Header title="Error" onBack={onBack} theme={theme} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Category data is not available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Debug: Log category details
  console.log(`CardScreen: Category "${category.name}" loaded with ${category.questions.length} questions`);

  const [index, setIndex] = React.useState(0);
  const [order, setOrder] = React.useState([...category.questions.map((_, i) => i)]);

  React.useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  React.useEffect(() => {
    if (typeof onViewedCard === 'function') {
      onViewedCard();
    }
  }, [index]);

  const width = Dimensions.get('window').width;
  const panX = React.useRef(new Animated.Value(0)).current;
  const rotate = panX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-8deg', '0deg', '8deg'],
  });
  const scale = panX.interpolate({
    inputRange: [-width, 0, width],
    outputRange: [0.96, 1, 0.96],
    extrapolate: 'clamp',
  });
  const overlayOpacity = panX.interpolate({
    inputRange: [-120, 0],
    outputRange: [0.25, 0],
    extrapolate: 'clamp',
  });

  const animateInFrom = (dir = 'right') => {
    panX.setValue(dir === 'right' ? width * 0.75 : -width * 0.75);
    Animated.spring(panX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 90,
      friction: 10,
    }).start();
  };

  const goNext = () => {
    Animated.timing(panX, {
      toValue: -width,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIndex((prev) => (prev + 1) % order.length);
      animateInFrom('right');
    });
  };
  const goPrev = () => {
    Animated.timing(panX, {
      toValue: width,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIndex((prev) => (prev - 1 + order.length) % order.length);
      animateInFrom('left');
    });
  };
  const shuffle = () => {
    const arr = [...order];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setIndex(0);
    animateInFrom('right');
  };

  const q = category.questions[order[index]];
  const qNext = category.questions[order[(index + 1) % order.length]];

  // Debug: Log question details
  console.log(`CardScreen: Question ${index + 1}/${category.questions.length}: ${q.substring(0, 50)}...`);

  const SWIPE_THRESHOLD = 80;
  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 6,
      onPanResponderMove: Animated.event([null, { dx: panX }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx <= -SWIPE_THRESHOLD) {
          goNext();
        } else if (gesture.dx >= SWIPE_THRESHOLD) {
          goPrev();
        } else {
          Animated.spring(panX, { toValue: 0, useNativeDriver: true, tension: 180, friction: 20 }).start();
        }
      },
    })
  ).current;

  const favActive = isFavorite(category.id, q);
  const right = (
    <TouchableOpacity onPress={() => onToggleFavorite(category, q)} style={styles.favButton}>
      <Ionicons name={favActive ? 'star' : 'star-outline'} size={22} color={favActive ? theme.colors.primaryText : theme.colors.text} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <Header title={category.name} onBack={onBack} right={right} theme={theme} />
      <View style={styles.deckStack}>
        <View style={styles.stackInner}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.card,
              { borderColor: category.color, position: 'absolute', left: 0, right: 0, top: 0 },
              {
                transform: [
                  { translateX: panX.interpolate({ inputRange: [-width, 0], outputRange: [0, 20], extrapolate: 'clamp' }) },
                  { scale: panX.interpolate({ inputRange: [-width, 0], outputRange: [1, 0.98], extrapolate: 'clamp' }) },
                ],
                opacity: panX.interpolate({ inputRange: [-120, 0], outputRange: [0.85, 0.35], extrapolate: 'clamp' }),
              },
            ]}
          >
            <LinearGradient
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16, opacity: 0.12 }]}
              colors={[hexToRgba(category.color, 0.12), 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.cardPrompt}>{qNext}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              { borderColor: category.color, position: 'absolute', left: 0, right: 0, top: 0 },
              { transform: [{ translateX: panX }, { rotate }, { scale }] },
            ]}
            {...panResponder.panHandlers}
          >
            <LinearGradient
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16, opacity: overlayOpacity }]}
              colors={[hexToRgba(category.color, 0.08), 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.cardPrompt}>{q}</Text>
          </Animated.View>
        </View>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={goPrev}>
          <Text style={styles.controlText}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={shuffle}>
          <Text style={styles.controlText}>Shuffle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => onShareQuestion && onShareQuestion(`${category.name}: ${q}`)}>
          <Text style={styles.controlText}>Share</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <TouchableOpacity style={styles.ctaButton} onPress={goNext}>
          <LinearGradient style={styles.ctaGradient} colors={[category.color || theme.colors.primary, theme.gradients.cta[1]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.ctaText}>Next Card</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={styles.progress}>
        <Text style={styles.progressText}>Card {index + 1} / {order.length}</Text>
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
  controlText: { color: '#2F2752', fontSize: 16, fontWeight: '600' },
  ctaButton: { marginTop: 28, borderRadius: 18, overflow: 'hidden' },
  ctaGradient: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 18 },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  progress: { alignItems: 'center', marginTop: 8 },
  progressText: { color: '#7A6FA3', fontSize: 13 },
  deckStack: { minHeight: 280, position: 'relative', marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  stackInner: { width: '100%', maxWidth: 640, marginHorizontal: 16, alignSelf: 'center', position: 'relative', minHeight: 240 },
  favButton: { paddingHorizontal: 10, paddingVertical: 6 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#2F2752', fontSize: 16, textAlign: 'center' },
});
