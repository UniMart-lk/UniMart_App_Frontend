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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function WelcomeScreen1({ navigation, onNext } = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else if (navigation?.navigate) {
      navigation.navigate('WelcomeScreen2');
    } else {
      try {
        router.push('/welcome2');
      } catch {
        // Navigation target can be hooked up when next screen is created
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Background Gradient matching the design */}
      <LinearGradient
        colors={['#1762e8', '#107de4', '#0793b8', '#029f93', '#00b777']}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Center Branding Content */}
      <View style={styles.centerContent}>
        <Image
          source={require('../../../../../assets/images/onboarding/welcome1.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.tagline}>
          Buy, Sell & Rent — Within Your{'\n'}University
        </Text>
      </View>

      {/* Bottom Circle Action / Indicator */}
      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: Math.max(insets.bottom + 20, 52) },
        ]}
      >
        <TouchableOpacity
          style={styles.circleButton}
          activeOpacity={0.7}
          onPress={handleNext}
          accessibilityLabel="Next"
          accessibilityRole="button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1762e8',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoImage: {
    width: Math.min(width * 0.65, 250),
    height: Math.min(width * 0.65, 250) * (101 / 334),
    marginBottom: 28,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 25,
    textAlign: 'center',
    letterSpacing: 0.3,
    opacity: 0.95,
  },
  bottomContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
});
