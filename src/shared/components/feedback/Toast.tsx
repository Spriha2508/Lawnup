import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onHide: () => void;
}

const bgClasses = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-gray-800',
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onHide }) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withTiming(1, { duration: 2500 }),
      withTiming(0, { duration: 300 }, () => runOnJS(onHide)())
    );
  }, [opacity, onHide]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[animStyle, { position: 'absolute', bottom: 100, left: 20, right: 20, zIndex: 999 }]}
      className={`${bgClasses[type]} rounded-2xl px-4 py-3`}
    >
      <Text className="text-white text-sm font-nunito-semibold text-center">{message}</Text>
    </Animated.View>
  );
};
