import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function AccountTypeScreen({ onSelectType } = {}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleSelectType = (type) => {
    if (onSelectType) {
      onSelectType(type);
      return;
    }
    // Navigate to the appropriate registration flow
    if (type === 'user') {
      try {
        router.push('/register-user');
      } catch {
        // Route not created yet — will be added later
      }
    } else {
      try {
        router.push('/register-provider');
      } catch {
        // Route not created yet — will be added later
      }
    }
  };

  const handleLogin = () => {
    try {
      router.push('/login');
    } catch {
      // Route not created yet
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 24,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        },
      ]}
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header: Logo + Title + Subtitle */}
      <View style={styles.header}>
        <Image
          source={require('../../../../assets/images/login/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Choose how you want to use UniMart</Text>
      </View>

      {/* Role Selection Cards */}
      <View style={styles.cardsContainer}>
        {/* Card 1: Buyer (Buy & Rent) */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => handleSelectType('user')}
          accessibilityRole="button"
          accessibilityLabel="Register as a buyer to browse, buy, and rent items"
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, styles.iconCircleBlue]}>
              <Text style={styles.iconEmoji}>🎓</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>I want to buy &amp; rent</Text>
              <Text style={styles.cardSubtitle}>Browse, buy, and rent items</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: Provider (Sell & Offer Rentals) */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => handleSelectType('provider')}
          accessibilityRole="button"
          accessibilityLabel="Register as a provider to sell and offer rentals"
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, styles.iconCircleGreen]}>
              <Text style={styles.iconEmoji}>🏪</Text>
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>I'm a provider</Text>
              <Text style={styles.cardSubtitle}>Sell items and offer rentals</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer: Login Link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={handleLogin} activeOpacity={0.6}>
          <Text style={styles.footerLink}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E9EDF4',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconCircleBlue: {
    backgroundColor: '#E9EFFF',
  },
  iconCircleGreen: {
    backgroundColor: '#E4F5EF',
  },
  iconEmoji: {
    fontSize: 26,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 20,
  },
  chevron: {
    fontSize: 28,
    color: '#94A3B8',
    fontWeight: '300',
    marginLeft: 8,
    marginTop: -4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '400',
  },
  footerLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
  },
});