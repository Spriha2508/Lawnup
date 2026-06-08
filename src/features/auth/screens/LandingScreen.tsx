import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuthNavigation } from '../../../navigation/AuthNavigationContext';

const { width: W, height: H } = Dimensions.get('window');

// ─── Leaf app icon ────────────────────────────────────────────────────────────
const AppIcon: React.FC = () => (
  <View style={styles.iconBox}>
    <Svg width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path
        d="M16 4C16 4 6 8 6 17C6 22.5228 10.4772 27 16 27C21.5228 27 26 22.5228 26 17C26 8 16 4 16 4Z"
        fill="white"
        opacity={0.9}
      />
      <Path
        d="M16 4L16 27"
        stroke="rgba(111,148,62,0.4)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M16 14C13 16 9 16 7 18M16 18C19 20 22 19 24 20"
        stroke="rgba(111,148,62,0.3)"
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  </View>
);

// ─── Apple logo ───────────────────────────────────────────────────────────────
const AppleLogo: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 814 1000" fill="#FFFFFF">
    <Path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-105.5-90.5-170.1-90.5-252.9c0-156.7 100.7-239.3 199.3-239.3 51.7 0 94.9 33.2 126.4 33.2 30.4 0 78.7-35.1 136.8-35.1 55.1 0 145.3 35.8 195.7 150zm-201.4-227.6c34.8-41.5 58.9-99.4 58.9-157.3 0-8.1-.6-16.2-1.9-23.8-55.4 2.1-120.9 37-159.7 82.9-31 35.8-59.5 93.2-59.5 152.1 0 9.2 1.6 18.4 2.3 21.4 3.2.6 8.4 1.3 13.6 1.3 49.4 0 111.2-32.5 146.3-76.6z" />
  </Svg>
);

// ─── Google G logo ────────────────────────────────────────────────────────────
const GoogleLogo: React.FC = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

// ─── Floating dots ────────────────────────────────────────────────────────────
const DOTS = [
  { top: H * 0.22, left: W * 0.08,  size: 5 },
  { top: H * 0.35, right: W * 0.12, size: 4 },
  { top: H * 0.18, right: W * 0.25, size: 6 },
  { top: H * 0.45, left: W * 0.18,  size: 3 },
  { top: H * 0.55, right: W * 0.08, size: 5 },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export const LandingScreen: React.FC = () => {
  const { navigate } = useAuthNavigation();

  return (
    <View style={styles.root}>
      {/* Blobs */}
      <View style={styles.blobGreen} />
      <View style={styles.blobGreenLow} />

      {/* Scattered dots */}
      {DOTS.map((d, i) => (
        <View
          key={i}
          style={[
            styles.floatingDot,
            { top: d.top, left: (d as any).left, right: (d as any).right, width: d.size, height: d.size, borderRadius: d.size / 2 },
          ]}
        />
      ))}

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Hero section */}
        <View style={styles.hero}>
          <AppIcon />

          <Text style={styles.eyebrow}>WELCOME TO LAWNUP</Text>

          <Text style={styles.headline}>Your plants{'\n'}deserve better</Text>

          <View style={styles.dotSeparator} />

          <Text style={styles.body}>
            A cinematic, AI-powered companion{'\n'}
            that helps your greenery thrive —{'\n'}
            one leaf at a time.
          </Text>
        </View>

        {/* Auth buttons */}
        <View style={styles.buttons}>
          {/* Email — primary CTA */}
          <Pressable
            style={styles.btnEmail}
            onPress={() => navigate('Signup')}
          >
            <Text style={styles.btnEmailText}>Continue with Email</Text>
          </Pressable>

          {/* Apple */}
          <Pressable
            style={styles.btnSocial}
            onPress={() => navigate('Signup')}
          >
            <AppleLogo />
            <Text style={styles.btnSocialText}>Continue with Apple</Text>
          </Pressable>

          {/* Google */}
          <Pressable
            style={styles.btnSocial}
            onPress={() => navigate('Signup')}
          >
            <GoogleLogo />
            <Text style={styles.btnSocialText}>Continue with Google</Text>
          </Pressable>

          <Text style={styles.terms}>
            By continuing you agree to our{' '}
            <Text style={styles.termsLink}>Terms & Privacy</Text>.
          </Text>

          <View style={styles.signinRow}>
            <Text style={styles.signinLabel}>Already have an account?  </Text>
            <Pressable onPress={() => navigate('Login')}>
              <Text style={styles.signinLink}>Sign in</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1E8',
    overflow: 'hidden',
  },

  // Background blobs
  blobGreen: {
    position: 'absolute',
    width: W * 0.85,
    height: W * 0.85,
    borderRadius: W * 0.425,
    backgroundColor: 'rgba(160,195,120,0.20)',
    top: -W * 0.35,
    left: -W * 0.2,
  },
  blobGreenLow: {
    position: 'absolute',
    width: W * 0.65,
    height: W * 0.65,
    borderRadius: W * 0.325,
    backgroundColor: 'rgba(140,180,100,0.10)',
    bottom: -W * 0.22,
    right: -W * 0.12,
  },
  floatingDot: {
    position: 'absolute',
    backgroundColor: 'rgba(111,148,62,0.15)',
  },

  safe: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 12,
  },

  // Hero
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#6F943E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    color: '#8A8575',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  headline: {
    fontSize: 44,
    fontFamily: 'Cormorant-SemiBold',
    color: '#111111',
    lineHeight: 50,
    marginBottom: 20,
  },
  dotSeparator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6F943E',
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    color: '#6E6A64',
    lineHeight: 26,
  },

  // Buttons
  buttons: {
    gap: 10,
    paddingBottom: 4,
  },
  btnEmail: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 16,
  },
  btnEmailText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  btnSocial: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#EEE7DA',
    borderRadius: 999,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#DDD4C7',
  },
  btnSocialText: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    color: '#111111',
    letterSpacing: 0.1,
  },
  terms: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
    textAlign: 'center',
    marginTop: 4,
  },
  termsLink: {
    color: '#6E6A64',
    fontFamily: 'Nunito-SemiBold',
  },
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  signinLabel: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    color: '#9E9A94',
  },
  signinLink: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    color: '#6F943E',
  },
});
