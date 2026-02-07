import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export function CarouselOnboardingScreen({ onContinue }) {
  const { theme, isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const scrollRef = React.useRef(null);

  const onboardingData = [
    {
      id: 1,
      title: "Welcome to Unfold Cards",
      subtitle: "Discover deeper connections through meaningful questions",
      icon: "heart-outline",
      color: "#8B5CF6",
    },
    {
      id: 2,
      title: "Explore Zones",
      subtitle: "Navigate through different relationship zones with curated questions",
      icon: "compass-outline",
      color: "#7C3AED",
    },
    {
      id: 3,
      title: "Share & Connect",
      subtitle: "Save favorites and share questions that spark meaningful conversations",
      icon: "share-outline",
      color: "#6B3AA0",
    },
  ];

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      scrollToIndex(currentIndex + 1);
    } else {
      onContinue();
    }
  };

  const scrollToIndex = (index) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
  };

  const handleScroll = (event) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / width);
    setCurrentIndex(index);
  };

  const renderItem = ({ item, index }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.cardContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <LinearGradient
          colors={isDark ? [item.color + '08', item.color + '03'] : [item.color + '15', item.color + '05']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.cardContent}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? item.color + '15' : item.color + '20' }]}>
            <Ionicons name={item.icon} size={48} color={item.color} />
          </View>
          
          <Text style={[styles.slideTitle, { color: isDark ? '#FFFFFF' : theme.colors.text }]}>
            {item.title}
          </Text>
          
          <Text style={[styles.slideSubtitle, { color: isDark ? '#A0A0A0' : theme.colors.textMuted }]}>
            {item.subtitle}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDot = (index) => (
    <TouchableOpacity
      key={index}
      onPress={() => scrollToIndex(index)}
      style={[
        styles.dot,
        currentIndex === index && [styles.activeDot, { backgroundColor: theme.colors.primary }],
        { backgroundColor: isDark ? '#333' : '#E0E0E0' }
      ]}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {onboardingData.map((item, index) => (
          <View key={item.id}>
            {renderItem({ item, index })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {onboardingData.map((_, index) => renderDot(index))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.9}
        >
          <Text style={styles.continueText}>
            {currentIndex === onboardingData.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onContinue} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: isDark ? '#A0A0A0' : theme.colors.textMuted }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 20, // Add some top padding for status bar
  },
  scrollView: {
    flex: 1,
    marginTop: 40, // Add margin for header
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20, // Add top padding
  },
  cardContainer: {
    width: '100%',
    maxWidth: 400, // Max width for larger screens
    height: '90%',
    maxHeight: 500, // Max height for larger screens
    minHeight: 400, // Min height for smaller screens
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6D6FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingBottom: 20, // Add bottom padding for safe area
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D4B5FF',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
  },
});
