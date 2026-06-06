import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  className = '',
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#E5E7EB', '#F3F4F6']
    ),
  }));

  return (
    <Animated.View
      style={[{ width: width as number, height, borderRadius }, animStyle]}
      className={className}
    />
  );
};

// Pre-built skeleton layouts
export const PlantCardSkeleton: React.FC = () => (
  <View className="bg-surface rounded-2xl p-4 mb-3" style={{ elevation: 3 }}>
    <Skeleton height={120} borderRadius={12} className="mb-3" />
    <Skeleton height={20} width="60%" borderRadius={6} className="mb-2" />
    <Skeleton height={14} width="40%" borderRadius={6} />
  </View>
);

export const ChatBubbleSkeleton: React.FC = () => (
  <View className="px-4 mb-4">
    <Skeleton height={16} width="80%" borderRadius={8} className="mb-2" />
    <Skeleton height={16} width="60%" borderRadius={8} />
  </View>
);
