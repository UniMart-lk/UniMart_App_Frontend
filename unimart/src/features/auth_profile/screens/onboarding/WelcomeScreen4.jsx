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

export default function WelcomeScreen4({ navigation, onFinish } = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleGetStarted = () => {
    if (onFinish) {
      onFinish();
    } else if (navigation?.navigate) {
      navigation.navigate('Login');
    } else {
      try {
        router.replace('/login');
      } catch {
        router.push('/login');
      }
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Top Header Placeholder (maintains visual vertical alignment) */}
      <View style={styles.headerSpacer} />

      {/* Main Illustration Graphic */}
      <View style={styles.illustrationWrapper}>
        <Image
          source={require('../../../../../assets/images/onboarding/welcome4.png')}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      {/* Content Section: Title and Subtitle */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Trusted & Verified</Text>
        <Text style={styles.description}>
          Verified student and external providers with ratings and reviews you can rely on.
        </Text>
      </View>

      {/* Bottom Section: Pagination Indicators & Get Started Button */}
      <View style={styles.bottomSection}>
        {/* Pagination Dots (3rd dot active) */}
        <View style={styles.paginationContainer}>
          <View style={[styles.dot, styles.inactiveDot]} />
          <View style={[styles.dot, styles.inactiveDot]} />
          <View style={[styles.dot, styles.activeDot]} />
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.getStartedButton}
          activeOpacity={0.85}
          onPress={handleGetStarted}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
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
  headerSpacer: {
    height: 32,
    paddingTop: 8,
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
  getStartedButton: {
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
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
