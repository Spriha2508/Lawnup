import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ScanNavigator } from './ScanNavigator';
import { PlantsNavigator } from './PlantsNavigator';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Icons ─────────────────────────────────────────────────────────────────────

const HomeIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
  </Svg>
);

const LeafIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 17.5C6.5 17.5 4 14 4 9.5C4 6.46243 6.46243 4 9.5 4C12.5376 4 15 6.46243 15 9.5C15 12.5376 12.5376 15 9.5 15H6.5V17.5Z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <Path d="M9.5 15C9.5 15 14 13 18 8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    <Path d="M6.5 20V17.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);

const ProfileIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.7} />
    <Path
      d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
    />
  </Svg>
);

const ScanIcon: React.FC = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7V5C3 3.89543 3.89543 3 5 3H7" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M17 3H19C20.1046 3 21 3.89543 21 5V7" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M21 17V19C21 20.1046 20.1046 21 19 21H17" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M7 21H5C3.89543 21 3 20.1046 3 19V17" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
    <Circle cx="12" cy="12" r="3" stroke="white" strokeWidth={1.8} />
  </Svg>
);

// ─── Custom tab bar ────────────────────────────────────────────────────────────

type TabKey = keyof MainTabParamList;
const TABS: { key: TabKey; label: string }[] = [
  { key: 'Home',    label: 'Home'   },
  { key: 'Plants',  label: 'Plants' },
  { key: 'Scan',    label: ''       },
  { key: 'Profile', label: 'You'    },
];

const TabButton: React.FC<{
  tabKey: TabKey;
  label: string;
  focused: boolean;
  onPress: () => void;
}> = memo(({ tabKey, label, focused, onPress }) => {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = focused ? '#1A1A14' : '#C4C0BA';

  const pressIn  = useCallback(() => { scale.value = withSpring(0.88, { damping: 20, stiffness: 400 }); }, []);
  const pressOut = useCallback(() => { scale.value = withSpring(1,    { damping: 18, stiffness: 300 }); }, []);

  // Center scan button
  if (tabKey === 'Scan') {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.scanWrap}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Animated.View style={[styles.scanBtn, anim]}>
          <ScanIcon />
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={styles.tabBtn}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={[styles.tabInner, anim]}>
        {tabKey === 'Home'    && <HomeIcon    color={color} />}
        {tabKey === 'Plants'  && <LeafIcon    color={color} />}
        {tabKey === 'Profile' && <ProfileIcon color={color} />}
        {label ? (
          <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
            {label}
          </Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
});

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
            onPress={() => navigation.navigate(key as string)}
          />
        );
      })}
    </View>
  </SafeAreaView>
));

// ─── Navigator ─────────────────────────────────────────────────────────────────

const renderTabBar = (props: BottomTabBarProps) => <CustomTabBar {...props} />;

export const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={renderTabBar}
    screenOptions={{ headerShown: false }}
    initialRouteName="Home"
  >
    <Tab.Screen name="Home"    component={HomeScreen} />
    <Tab.Screen name="Plants"  component={PlantsNavigator} />
    <Tab.Screen name="Scan"    component={ScanNavigator} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FAF7F0',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200,196,188,0.6)',
    ...Platform.select({
      default: {
        shadowColor: '#1A1A08',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 16,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },

  // Regular tab
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabInner: {
    alignItems: 'center',
    gap: 5,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-SemiBold',
    color: '#B8B4AA',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: '#1A1A14',
  },

  // Scan center button
  scanWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  scanBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
  },
});
