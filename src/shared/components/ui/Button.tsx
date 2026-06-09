import React, { useRef, useState } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  Animated,
  Platform,
  ViewStyle,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  testID?: string;
}

const BG: Record<Variant, string> = {
  primary:   '#6F943E',
  secondary: '#A7C47C',
  outline:   'transparent',
  ghost:     'transparent',
  danger:    '#DC2626',
};

const BG_DISABLED: Record<Variant, string> = {
  primary:   '#B8CFA0',
  secondary: '#C8DDB0',
  outline:   'transparent',
  ghost:     'transparent',
  danger:    '#F0A0A0',
};

const BG_ACTIVE: Record<Variant, string> = {
  primary:   '#5A7A30',
  secondary: '#8FB060',
  outline:   'rgba(111,148,62,0.06)',
  ghost:     'rgba(111,148,62,0.06)',
  danger:    '#B91C1C',
};

const TEXT_COLOR: Record<Variant, string> = {
  primary:   '#FFFFFF',
  secondary: '#2A3D1A',
  outline:   '#6F943E',
  ghost:     '#6F943E',
  danger:    '#FFFFFF',
};

const SIZE_STYLE: Record<Size, ViewStyle> = {
  sm: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 },
  md: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 999 },
  lg: { paddingVertical: 17, paddingHorizontal: 32, borderRadius: 999 },
};

const TEXT_SIZE: Record<Size, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  onPress,
  className,
  style,
  testID,
}) => {
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
      bounciness: 4,
    }).start();
  };

  const resolvedBg = isDisabled
    ? BG_DISABLED[variant]
    : hovered
    ? BG_ACTIVE[variant]
    : BG[variant];

  const borderProps: ViewStyle =
    variant === 'outline'
      ? { borderWidth: 1.5, borderColor: isDisabled ? '#B8CFA0' : '#6F943E' }
      : {};

  const shadowProps: ViewStyle =
    variant === 'primary' && !isDisabled
      ? {
          shadowColor: '#6F943E',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.28,
          shadowRadius: 14,
          elevation: 6,
        }
      : {};

  const webCursorStyle = Platform.OS === 'web'
    ? ({ cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'background-color 0.15s ease' } as object)
    : {};

  return (
    <Animated.View
      // @ts-ignore — className accepted by NativeWind on Animated.View
      className={className}
      style={[
        fullWidth ? { width: '100%' } : { alignSelf: 'flex-start' },
        { transform: [{ scale }] },
        shadowProps,
        style,
      ]}
      testID={testID}
    >
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        // @ts-ignore
        onMouseEnter={Platform.OS === 'web' ? () => setHovered(true) : undefined}
        onMouseLeave={Platform.OS === 'web' ? () => setHovered(false) : undefined}
        style={[
          SIZE_STYLE[size],
          borderProps,
          {
            backgroundColor: resolvedBg,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            width: fullWidth ? '100%' : undefined,
          },
          webCursorStyle as ViewStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? '#6F943E' : '#FFFFFF'}
          />
        ) : (
          <Text
            style={{
              color: TEXT_COLOR[variant],
              fontSize: TEXT_SIZE[size],
              fontFamily: 'Nunito-Bold',
              fontWeight: '700',
              letterSpacing: 0.3,
            }}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};
