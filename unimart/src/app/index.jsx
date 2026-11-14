import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Image, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import authService from '@/services/authService';
import WelcomeScreen1 from '@/features/auth_profile/screens/onboarding/WelcomeScreen1';

const { width } = Dimensions.get('window');

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAppEntry();
  }, []);

  const checkAppEntry = async () => {
    try {
      // 1. Check if user is actively logged in (token + user data)
      const isAuth = await authService.isAuthenticated();
      const storedUser = await authService.getStoredUser();

      if (isAuth && storedUser) {
        // Direct entry to marketplace for logged in users
        router.replace('/marketplace');
        return;
      }

      // 2. Check if user already has an account OR has seen onboarding
      const hasAccount = await authService.hasExistingAccount();
      const onboardingCompleted = await authService.isOnboardingCompleted();

      if (hasAccount || onboardingCompleted) {
        // Never show onboarding to users who have an account or completed onboarding
        router.replace('/login');
        return;
      }

      // 3. First time user: show onboarding
      setChecking(false);
    } catch (error) {
      console.log('App entry routing check error:', error);
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <LinearGradient
          colors={['#1762e8', '#107de4', '#0793b8', '#029f93', '#00b777']}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.splashCenter}>
          <Image
            source={require('../../assets/images/onboarding/welcome1.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <ActivityIndicator color="#FFFFFF" size="small" style={{ marginTop: 24 }} />
        </View>
      </View>
    );
  }

  return <WelcomeScreen1 />;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#1762e8',
  },
  splashCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoImage: {
    width: Math.min(width * 0.65, 250),
    height: Math.min(width * 0.65, 250) * (101 / 334),
  },
});
