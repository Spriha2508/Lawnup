/**
 * ON-SCREEN DIAGNOSTIC
 * Every layer is tested automatically and the result is drawn on screen.
 * No adb, no Metro console needed — look at the phone.
 *
 * When a stable stage is confirmed, set RUN_FULL_APP = true at the bottom.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, Platform,
} from 'react-native';

// ─── On-screen logger (visible on device) ────────────────────────────────────
type Status = 'pending' | 'running' | 'pass' | 'fail' | 'skip';
interface LogLine { id: string; label: string; status: Status; detail?: string; }

const icon: Record<Status, string> = {
  pending: '○',
  running: '▶',
  pass:    '◆',
  fail:    '✕',
  skip:    '⊘',
};
const color: Record<Status, string> = {
  pending: '#888',
  running: '#FFD700',
  pass:    '#6F943E',
  fail:    '#FF6B6B',
  skip:    '#888',
};

// ─── Individual test runner ───────────────────────────────────────────────────
async function runWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const t = setTimeout(
      () => resolve({ ok: false, error: `TIMEOUT after ${timeoutMs}ms` }),
      timeoutMs,
    );
    fn()
      .then((value) => { clearTimeout(t); resolve({ ok: true, value }); })
      .catch((e: any) => { clearTimeout(t); resolve({ ok: false, error: e?.message ?? String(e) }); });
  });
}

// ─── Diagnostic runner ────────────────────────────────────────────────────────
async function runDiagnostics(
  update: (id: string, status: Status, detail?: string) => void,
): Promise<void> {
  const pass = (id: string, detail?: string) => update(id, 'pass', detail);
  const fail = (id: string, detail: string)  => update(id, 'fail', detail);
  const run  = (id: string)                  => update(id, 'running');

  // ── 1. React Native core ──────────────────────────────────────────────────
  run('rn');
  pass('rn', `Platform: ${Platform.OS} ${Platform.Version}`);

  // ── 2. GestureHandler ────────────────────────────────────────────────────
  run('gesture');
  try {
    require('react-native-gesture-handler');
    pass('gesture');
  } catch (e: any) { fail('gesture', e?.message); return; }

  // ── 3. SafeAreaContext ────────────────────────────────────────────────────
  run('safe');
  try {
    require('react-native-safe-area-context');
    pass('safe');
  } catch (e: any) { fail('safe', e?.message); return; }

  // ── 4. Navigation libs ────────────────────────────────────────────────────
  run('nav');
  try {
    require('@react-navigation/native');
    require('@react-navigation/stack');
    pass('nav');
  } catch (e: any) { fail('nav', e?.message); return; }

  // ── 5. Reanimated ────────────────────────────────────────────────────────
  run('reanimated');
  try {
    const R = require('react-native-reanimated');
    const sv = R.useSharedValue; // just import check, not hook call
    if (typeof sv !== 'function') throw new Error('useSharedValue not a function');
    pass('reanimated');
  } catch (e: any) { fail('reanimated', e?.message); }

  // ── 6. Expo Font ─────────────────────────────────────────────────────────
  run('font');
  const fontResult = await runWithTimeout(async () => {
    const Font = require('expo-font');
    await Font.loadAsync({
      'Nunito-Regular': require('../../assets/fonts/Nunito-Regular.ttf'),
      'Nunito-Bold':    require('../../assets/fonts/Nunito-Bold.ttf'),
    });
    return true;
  }, 5000, 'Font.loadAsync');
  if (fontResult.ok) pass('font'); else fail('font', fontResult.error);

  // ── 7. SplashScreen ───────────────────────────────────────────────────────
  run('splash');
  try {
    const SP = require('expo-splash-screen');
    await SP.hideAsync().catch(() => {}); // may already be hidden — OK
    pass('splash');
  } catch (e: any) { fail('splash', e?.message); }

  // ── 8. Zustand store ─────────────────────────────────────────────────────
  run('zustand');
  try {
    const { useAuthStore } = require('../features/auth/store/authStore');
    if (typeof useAuthStore !== 'function') throw new Error('store not a function');
    pass('zustand');
  } catch (e: any) { fail('zustand', e?.message); }

  // ── 9. Firebase init ──────────────────────────────────────────────────────
  run('firebase');
  try {
    const { auth, db } = require('../services/firebase/firebaseConfig');
    if (!auth || !db) throw new Error('auth or db is null');
    pass('firebase', 'app initialized');
  } catch (e: any) { fail('firebase', e?.message); }

  // ── 10. Firebase onAuthStateChanged ──────────────────────────────────────
  run('auth');
  const authResult = await runWithTimeout(async () => {
    const { onAuthStateChanged } = require('@firebase/auth');
    const { auth } = require('../services/firebase/firebaseConfig');
    return new Promise<string>((resolve, reject) => {
      const unsub = onAuthStateChanged(
        auth,
        (user: any) => { unsub(); resolve(user ? `signed in: ${user.uid}` : 'not signed in'); },
        (err: any) => { unsub(); reject(err); },
      );
    });
  }, 8000, 'onAuthStateChanged');
  if (authResult.ok) pass('auth', authResult.value as string);
  else fail('auth', authResult.error);

  // ── 11. NativeWind / Tailwind class parse ─────────────────────────────────
  run('nativewind');
  try {
    const NW = require('nativewind');
    if (!NW) throw new Error('nativewind module empty');
    pass('nativewind');
  } catch (e: any) { fail('nativewind', e?.message); }

  // ── 12. React Navigation render ───────────────────────────────────────────
  run('navrender');
  pass('navrender', 'If you see this, NavigationContainer rendered OK');
}

// ─── Diagnostic screen component ─────────────────────────────────────────────
const CHECKS: { id: string; label: string }[] = [
  { id: 'rn',         label: 'React Native core'        },
  { id: 'gesture',    label: 'GestureHandler'            },
  { id: 'safe',       label: 'SafeAreaContext'           },
  { id: 'nav',        label: 'React Navigation libs'     },
  { id: 'reanimated', label: 'Reanimated v4'             },
  { id: 'font',       label: 'expo-font loadAsync'       },
  { id: 'splash',     label: 'SplashScreen.hideAsync'    },
  { id: 'zustand',    label: 'Zustand auth store'        },
  { id: 'firebase',   label: 'Firebase init'             },
  { id: 'auth',       label: 'Firebase onAuthStateChanged (8s)' },
  { id: 'nativewind', label: 'NativeWind'                },
  { id: 'navrender',  label: 'NavigationContainer render'},
];

const DiagnosticScreen: React.FC = () => {
  const [lines, setLines] = useState<LogLine[]>(
    CHECKS.map((c) => ({ id: c.id, label: c.label, status: 'pending' })),
  );
  const [done, setDone] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const update = (id: string, status: Status, detail?: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status, detail } : l)),
    );
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  useEffect(() => {
    const firstId = CHECKS[0].id;
    update(firstId, 'running');

    runDiagnostics(update).then(() => {
      setDone(true);
    }).catch((e: any) => {
      update('navrender', 'fail', `Diagnostic crash: ${e?.message}`);
      setDone(true);
    });
  }, []);

  const passed  = lines.filter((l) => l.status === 'pass').length;
  const failed  = lines.filter((l) => l.status === 'fail').length;
  const running = lines.filter((l) => l.status === 'running').length;

  return (
    <View style={d.root}>
      <View style={d.header}>
        <Text style={d.title}>LawnUp Diagnostic</Text>
        <Text style={d.sub}>
          {done
            ? `Done — ${passed} pass · ${failed} fail`
            : running
            ? `Testing...`
            : 'Starting...'}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={d.list}
        contentContainerStyle={d.listContent}
        showsVerticalScrollIndicator={false}
      >
        {lines.map((line) => (
          <View key={line.id} style={d.row}>
            <Text style={[d.icon, { color: color[line.status] }]}>
              {line.status === 'running'
                ? '▶'
                : icon[line.status]}
            </Text>
            <View style={d.rowText}>
              <Text style={[d.label, line.status === 'fail' && d.labelFail]}>
                {line.label}
              </Text>
              {line.detail ? (
                <Text style={[d.detail, line.status === 'fail' && d.detailFail]} numberOfLines={3}>
                  {line.detail}
                </Text>
              ) : null}
            </View>
            {line.status === 'running' && (
              <ActivityIndicator size="small" color="#FFD700" style={{ marginLeft: 8 }} />
            )}
          </View>
        ))}

        {done && (
          <View style={d.summary}>
            <Text style={d.summaryText}>
              {failed === 0
                ? '◆ All checks passed!\nSet RUN_FULL_APP = true in App.tsx'
                : `✕ ${failed} check${failed > 1 ? 's' : ''} failed above.\nFix the first red item.`}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const d = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#0F1F14' },
  header:      { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1E3525' },
  title:       { color: '#6F943E', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  sub:         { color: '#6B9E82', fontSize: 13, marginTop: 4 },
  list:        { flex: 1 },
  listContent: { padding: 16, gap: 2 },
  row:         { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4, backgroundColor: '#152219' },
  icon:        { fontSize: 16, width: 24, marginTop: 1 },
  rowText:     { flex: 1 },
  label:       { color: '#D4EDD0', fontSize: 14, fontWeight: '600' },
  labelFail:   { color: '#FF6B6B' },
  detail:      { color: '#6B9E82', fontSize: 11, marginTop: 3 },
  detailFail:  { color: '#FF9999' },
  summary:     { marginTop: 24, padding: 20, backgroundColor: '#1A2E1F', borderRadius: 14, borderWidth: 1, borderColor: '#2D5A3D' },
  summaryText: { color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 22 },
});

// ─── Entry point ─────────────────────────────────────────────────────────────
// When all diagnostics pass, flip this to true to run the real app.
const RUN_FULL_APP = true;

let AppComponent: React.FC;

if (RUN_FULL_APP) {
  // Full production boot (restored after diagnostics pass)
  const { StatusBar }              = require('expo-status-bar');
  const { GestureHandlerRootView } = require('react-native-gesture-handler');
  const { SafeAreaProvider }       = require('react-native-safe-area-context');
  const { NavigationContainer }    = require('@react-navigation/native');
  const SplashScreen               = require('expo-splash-screen');
  const Font                       = require('expo-font');
  const { RootNavigator }          = require('../navigation/RootNavigator');
  const { QueryProvider }          = require('./providers/QueryProvider');
  const { NotificationProvider }   = require('./providers/NotificationProvider');
  const { AnimatedSplash }         = require('../shared/components/motion/AnimatedSplash');
  const { ErrorBoundary }          = require('../shared/components/feedback/ErrorBoundary');

  SplashScreen.preventAutoHideAsync().catch(() => {});

  // Initialise crash reporting once at boot (no-op until Sentry is wired).
  require('../services/monitoring/crashReporting').initCrashReporting();
  // Configure Google Sign-In once (no-op until the Web client ID is set).
  require('../features/auth/services/googleSignIn').configureGoogleSignIn();

  const FullApp: React.FC = () => {
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [splashDone, setSplashDone]   = useState(false);

    useEffect(() => {
      Font.loadAsync({
        'Nunito-Regular':   require('../../assets/fonts/Nunito-Regular.ttf'),
        'Nunito-SemiBold':  require('../../assets/fonts/Nunito-SemiBold.ttf'),
        'Nunito-Bold':      require('../../assets/fonts/Nunito-Bold.ttf'),
        'Nunito-ExtraBold': require('../../assets/fonts/Nunito-ExtraBold.ttf'),
      })
        .then(() => setFontsLoaded(true))
        .catch(() => setFontsLoaded(true));
      const t = setTimeout(() => setFontsLoaded(true), 4000);
      return () => clearTimeout(t);
    }, []);

    const onLayout = React.useCallback(async () => {
      if (!fontsLoaded) return;
      try { await SplashScreen.hideAsync(); } catch {}
    }, [fontsLoaded]);

    if (!fontsLoaded) return <View style={{ flex:1, backgroundColor:'#F5F1E8', alignItems:'center', justifyContent:'center' }}><ActivityIndicator color="#6F943E" size="large" /></View>;

    return (
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
        <SafeAreaProvider>
          <ErrorBoundary>
            <QueryProvider>
              <NavigationContainer theme={{ dark: false, colors: { background: '#F5F1E8', card: '#F5F1E8', text: '#111111', border: 'transparent', primary: '#6F943E', notification: '#6F943E' } }}>
                <NotificationProvider>
                  <StatusBar style="light" />
                  <RootNavigator />
                  {!splashDone && (
                    <AnimatedSplash onDone={() => setSplashDone(true)} />
                  )}
                </NotificationProvider>
              </NavigationContainer>
            </QueryProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  };

  AppComponent = FullApp;
} else {
  AppComponent = DiagnosticScreen;
}

export const RootApp = AppComponent;
