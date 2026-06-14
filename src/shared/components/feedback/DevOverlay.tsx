import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSubscriptionStore } from '../../../features/subscription/store/subscriptionStore';
import { useScanStore } from '../../../features/scan/store/scanStore';

// Safe wrapper — useNavigationState throws if rendered outside NavigationContainer.
// We import it lazily and catch any error so the overlay never crashes the app.
let _useNavigationState: typeof import('@react-navigation/native').useNavigationState;
try {
  _useNavigationState = require('@react-navigation/native').useNavigationState;
} catch {
  _useNavigationState = (() => null) as any;
}

function useCurrentRoute(): string {
  try {
     
    return _useNavigationState((state) => {
      if (!state) return '—';
      const getLeaf = (s: typeof state): string => {
        const route = s.routes[s.index ?? 0];
        if (!route) return '—';
        if (route.state) return getLeaf(route.state as typeof state);
        return route.name;
      };
      return getLeaf(state);
    }) ?? '—';
  } catch {
    return '—';
  }
}

// Only renders in __DEV__ mode. Mount once at the app root.

interface LogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error';
  msg: string;
}

const MAX_LOG_LINES = 40;
const logBuffer: LogEntry[] = [];

// Monkey-patch console to capture recent logs
let patched = false;
function patchConsole() {
  if (patched || !__DEV__) return;
  patched = true;

  const orig = {
    log:   console.log.bind(console),
    warn:  console.warn.bind(console),
    error: console.error.bind(console),
  };

  const push = (level: LogEntry['level'], args: unknown[]) => {
    const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    logBuffer.push({ ts: Date.now(), level, msg });
    if (logBuffer.length > MAX_LOG_LINES) logBuffer.shift();
  };

  console.log   = (...a) => { orig.log(...a);   push('info',  a); };
  console.warn  = (...a) => { orig.warn(...a);  push('warn',  a); };
  console.error = (...a) => { orig.error(...a); push('error', a); };
}

if (__DEV__) patchConsole();

class DevOverlayBoundary extends React.Component<
  { children: React.ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };
  componentDidCatch(e: Error) {
    console.warn('[DevOverlay] crashed silently:', e.message);
    this.setState({ crashed: true });
  }
  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}

export const DevOverlay: React.FC = () => {
  if (!__DEV__) return null;

  return (
    <DevOverlayBoundary>
      <DevOverlayInner />
    </DevOverlayBoundary>
  );
};

const DevOverlayInner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refresh the panel every second when open
  useEffect(() => {
    if (visible) {
      timerRef.current = setInterval(() => setTick(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [visible]);

  // Safe: falls back to '—' if called outside NavigationContainer
  const routeName = useCurrentRoute();

  const sub   = useSubscriptionStore.getState();
  const scan  = useScanStore.getState();

  const scansThisWeek = sub.scansThisWeek;
  const weeklyLimit = sub.isPremiumActive() ? '∞' : String(sub.scanLimit);
  const isScanning = scan.isScanning;
  const lastScan   = scan.scanResult?.commonName ?? '—';

  const recentLogs = logBuffer.slice(-15);

  return (
    <>
      {/* Floating toggle button */}
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setVisible(v => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.toggleText}>{visible ? '✕' : 'DEV'}</Text>
      </TouchableOpacity>

      {visible && (
        <View style={styles.panel} pointerEvents="box-none">
          {/* Stats */}
          <View style={styles.statsRow}>
            <Stat label="Route"   value={routeName} />
            <Stat label="Scans"   value={`${scansThisWeek}/${weeklyLimit}`} />
            <Stat label="Plan"    value={sub.plan + (sub.mockPremium ? '★' : '')} />
            <Stat label="Scanning" value={isScanning ? 'YES' : 'no'} highlight={isScanning} />
          </View>
          <View style={styles.statsRow}>
            <Stat label="Last ID" value={lastScan} wide />
            <Stat label="Hydrated" value={sub.isUsageHydrated ? 'yes' : 'NO'} highlight={!sub.isUsageHydrated} />
          </View>

          {/* Log tail */}
          <ScrollView style={styles.logBox} showsVerticalScrollIndicator={false}>
            {recentLogs.map((entry, i) => (
              <Text
                key={i}
                style={[
                  styles.logLine,
                  entry.level === 'warn'  && styles.logWarn,
                  entry.level === 'error' && styles.logError,
                ]}
                numberOfLines={2}
              >
                {entry.msg}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const Stat: React.FC<{ label: string; value: string; wide?: boolean; highlight?: boolean }> = ({
  label, value, wide, highlight,
}) => (
  <View style={[styles.stat, wide && styles.statWide]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, highlight && styles.statHighlight]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  toggle: {
    position: 'absolute',
    bottom: 100,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  toggleText: {
    color: '#7CFC00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  panel: {
    position: 'absolute',
    bottom: 148,
    right: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderRadius: 10,
    padding: 10,
    zIndex: 9998,
    maxHeight: 300,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 6,
    padding: 5,
  },
  statWide: { flex: 2 },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  statHighlight: { color: '#FFB020' },
  logBox: {
    maxHeight: 150,
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 4,
  },
  logLine: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 9,
    fontFamily: 'monospace' as any,
    lineHeight: 14,
  },
  logWarn:  { color: '#FFB020' },
  logError: { color: '#FF5C5C' },
});
