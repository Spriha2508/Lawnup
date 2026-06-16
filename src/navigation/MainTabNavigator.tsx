import React, { memo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ScanNavigator } from './ScanNavigator';
import { PlantsNavigator } from './PlantsNavigator';
import { ChatNavigator } from './ChatNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import { theme } from '@constants/designSystem';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const { color: C, fonts: F } = theme;

// ─── Plant-themed icons ──────────────────────────────────────────────────────
const HomeIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
      stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
  </Svg>
);

const LeafIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M6.5 17.5C6.5 17.5 4 14 4 9.5C4 6.46243 6.46243 4 9.5 4C12.5376 4 15 6.46243 15 9.5C15 12.5376 12.5376 15 9.5 15H6.5V17.5Z"
      stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M9.5 15C9.5 15 14 13 18 8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    <Path d="M6.5 20V17.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);

// AI Doctor — chat bubble with a leaf inside
const ChatIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M21 11.5C21 16 17 19 12 19C10.8 19 9.7 18.8 8.7 18.5L4 20L5.3 16.2C4.5 15 4 13.3 4 11.5C4 7 8 4 12 4C17 4 21 7 21 11.5Z"
      stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M12 8C12 8 9 9.2 9 11.5C9 13 10.2 14 12 14C13 14 14 13 14 11.5C14 9.2 12 8 12 8Z" fill={color} opacity={0.55} />
  </Svg>
);

const ProfileIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.7} />
    <Path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);

const ScanIcon: React.FC = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7V5C3 3.89543 3.89543 3 5 3H7" stroke={C.onInkBtn} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M17 3H19C20.1046 3 21 3.89543 21 5V7" stroke={C.onInkBtn} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M21 17V19C21 20.1046 20.1046 21 19 21H17" stroke={C.onInkBtn} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M7 21H5C3.89543 21 3 20.1046 3 19V17" stroke={C.onInkBtn} strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx="12" cy="12" r="3" stroke={C.onInkBtn} strokeWidth={1.8} />
  </Svg>
);

// Small sprout that grows under the active tab
const Sprout: React.FC<{ active: boolean }> = ({ active }) => {
  const grow = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    grow.value = active
      ? withSpring(1, theme.motion.spring.bouncy)
      : withTiming(0, { duration: theme.motion.duration.fast });
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  const style = useAnimatedStyle(() => ({
    opacity: grow.value,
    transform: [{ scale: grow.value }],
  }));
  return (
    <Animated.View style={[styles.sprout, style]}>
      <Svg width={14} height={10} viewBox="0 0 14 10" fill="none">
        <Path d="M7 10V4" stroke={C.primary} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M7 5C7 5 5 5.5 4 4C5.5 3 7 4 7 5Z" fill={C.primary} />
        <Path d="M7 5C7 5 9 5.5 10 4C8.5 3 7 4 7 5Z" fill={C.primarySoft} />
      </Svg>
    </Animated.View>
  );
};

// ─── Custom tab bar ──────────────────────────────────────────────────────────
type TabKey = keyof MainTabParamList;
const TABS: { key: TabKey; label: string }[] = [
  { key: 'Home',    label: 'Home'   },
  { key: 'Plants',  label: 'Garden' },
  { key: 'Scan',    label: ''       },
  { key: 'Chat',    label: 'Doctor' },
  { key: 'Profile', label: 'Profile' },
];

const TabButton: React.FC<{
  tabKey: TabKey;
  label: string;
  focused: boolean;
  onPress: () => void;
}> = memo(({ tabKey, label, focused, onPress }) => {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  // Dark grounded bar: inactive = soft light, active = luminous primary green.
  const color = focused ? C.primary : 'rgba(240,253,244,0.45)';

  const pressIn  = useCallback(() => { scale.value = withSpring(0.88, theme.motion.spring.snappy); }, []); // eslint-disable-line
  const pressOut = useCallback(() => { scale.value = withSpring(1,    theme.motion.spring.gentle); }, []); // eslint-disable-line

  // Center scan button
  if (tabKey === 'Scan') {
    return (
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.scanWrap}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Animated.View style={[styles.scanBtn, anim]}>
          <ScanIcon />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={styles.tabBtn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Animated.View style={[styles.tabInner, anim]}>
        {tabKey === 'Home'    && <HomeIcon    color={color} />}
        {tabKey === 'Plants'  && <LeafIcon    color={color} />}
        {tabKey === 'Chat'    && <ChatIcon    color={color} />}
        {tabKey === 'Profile' && <ProfileIcon color={color} />}
        {label ? (
          <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
        ) : null}
        <Sprout active={focused} />
      </Animated.View>
    </Pressable>
  );
});
TabButton.displayName = 'TabButton';

const CustomTabBar: React.FC<BottomTabBarProps> = memo(({ state, navigation }) => (
  <SafeAreaView edges={['bottom']} style={styles.bar}>
    <View style={styles.row}>
      {TABS.map(({ key, label }) => {
        const idx     = state.routes.findIndex(r => r.name === key);
        const focused = idx !== -1 && state.index === idx;
        return (
          <TabButton
            key={key}
            tabKey={key}
            label={label}
            focused={focused}
            onPress={() => {
              if (key === 'Scan') {
                (navigation as any).navigate('Scan', { screen: 'Camera' });
              } else {
                navigation.navigate(key as string);
              }
            }}
          />
        );
      })}
    </View>
  </SafeAreaView>
));
CustomTabBar.displayName = 'CustomTabBar';

// ─── Navigator ───────────────────────────────────────────────────────────────
const renderTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }} initialRouteName="Home">
    <Tab.Screen name="Home"    component={HomeScreen} />
    <Tab.Screen name="Plants"  component={PlantsNavigator} />
    <Tab.Screen name="Scan"    component={ScanNavigator} />
    <Tab.Screen name="Chat"    component={ChatNavigator} />
    <Tab.Screen name="Profile" component={ProfileNavigator} />
  </Tab.Navigator>
);

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bar: {
    // Dark grounded glass over the void world — always visible, never floats.
    backgroundColor: 'rgba(6,15,10,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(74,222,128,0.12)',
    ...Platform.select({
      default: {
        shadowColor: '#000000', shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 16,
      },
    }),
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingTop: 10, paddingBottom: 4 },

  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  tabInner: { alignItems: 'center', gap: 4 },
  tabLabel: { fontFamily: F.sansMedium, fontSize: 10, color: 'rgba(240,253,244,0.45)', letterSpacing: 0.3 },
  tabLabelActive: { color: C.primary, fontFamily: F.sansBold },
  sprout: { height: 10, marginTop: 1, alignItems: 'center', justifyContent: 'center' },

  scanWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  scanBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: C.inkBtn,
    alignItems: 'center', justifyContent: 'center', marginTop: -24,
    shadowColor: C.inkBtn, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 14, elevation: 12,
  },
});
