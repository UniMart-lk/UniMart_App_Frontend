import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function WelcomeScreen3({ navigation, onNext, onSkip } = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (navigation?.navigate) {
      navigation.navigate('WelcomeScreen4');
    } else {
      try {
        router.push('/welcome4');
      } catch {
        // Fallback for next onboarding screen
      }
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else if (navigation?.navigate) {
      navigation.navigate('Login');
    } else {
      try {
        router.push('/login');
      } catch {
        // Fallback for skip
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Top Header with Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Illustration Graphic */}
      <View style={styles.illustrationWrapper}>
        <Image
          source={require('../../../../../assets/images/onboarding/welcome3.png')}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      {/* Content Section: Title and Subtitle */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Rent Vehicles & Equipment</Text>
        <Text style={styles.description}>
          Discover rental options near your university — from bikes to camping gear.
        </Text>
      </View>

      {/* Bottom Section: Pagination Indicators & Next Button */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots (Middle active) */}
        <View style={styles.paginationContainer}>
          <View style={[styles.dot, styles.inactiveDot]} />
          <View style={[styles.dot, styles.activeDot]} />
          <View style={[styles.dot, styles.inactiveDot]} />
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={styles.nextButton}
          activeOpacity={0.85}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexShrink: 1,
  },
  illustrationImage: {
    width: Math.min(width * 0.88, 360),
    height: Math.min(width * 0.88, 360) * (563 / 523),
    maxHeight: 380,
  },
  textContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#64748B',
    fontWeight: '400',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#2563EB',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  nextButton: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
