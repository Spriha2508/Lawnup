import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { DS } from '../../../constants/ds';

type IconProps = { color: string; size?: number };

export const HomeIcon: React.FC<IconProps> = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
      stroke={color}
      strokeWidth={1.75}
      strokeLinejoin="round"
    />
  </Svg>
);

export const ScanIcon: React.FC<IconProps> = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 7V5C3 3.89543 3.89543 3 5 3H7"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
    />
    <Path
      d="M17 3H19C20.1046 3 21 3.89543 21 5V7"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
    />
    <Path
      d="M21 17V19C21 20.1046 20.1046 21 19 21H17"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
    />
    <Path
      d="M7 21H5C3.89543 21 3 20.1046 3 19V17"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
    />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.75} />
    <Path d="M12 3V5M12 19V21M3 12H5M19 12H21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

export const LeafIcon: React.FC<IconProps> = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 17.5C6.5 17.5 4 14 4 9.5C4 6.46243 6.46243 4 9.5 4C12.5376 4 15 6.46243 15 9.5C15 12.5376 12.5376 15 9.5 15H6.5V17.5Z"
      stroke={color}
      strokeWidth={1.75}
      strokeLinejoin="round"
    />
    <Path
      d="M9.5 15C9.5 15 14 13 18 8"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
    />
    <Path d="M6.5 20V17.5" stroke={color} strokeWidth={1.75} strokeLinecap="round" />
  </Svg>
);

export const ProfileIcon: React.FC<IconProps> = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.75} />
    <Path
      d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
      stroke={color}
      strokeWidth={1.75}
      strokeLinecap="round"
    />
  </Svg>
);

// The scan tab gets a special pill background when active
export const ScanTabButton: React.FC<{ focused: boolean; size?: number }> = ({
  focused,
  size = 22,
}) => (
  <View
    style={[
      styles.scanPill,
      focused && styles.scanPillActive,
    ]}
  >
    <ScanIcon color={focused ? '#FFFFFF' : DS.color.tabInactive} size={size} />
  </View>
);

const styles = StyleSheet.create({
  scanPill: {
    width: 52,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scanPillActive: {
    backgroundColor: DS.color.forestDark,
  },
});
