import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scaleAnimationMs } from './animationSpeed';
import { MOTION_CURVES } from './motionCurves';

type UseAnimatedCtaStateOptions = {
  isEnabled: boolean;
};

const ENABLED_SCALE = 1;
const DISABLED_SCALE = 0.98;

export function useAnimatedCtaState({ isEnabled }: UseAnimatedCtaStateOptions) {
  const scale = useSharedValue(isEnabled ? ENABLED_SCALE : DISABLED_SCALE);

  useEffect(() => {
    scale.value = withTiming(isEnabled ? ENABLED_SCALE : DISABLED_SCALE, {
      duration: scaleAnimationMs(200),
      easing: MOTION_CURVES.gentleOut,
    });
  }, [isEnabled, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
  };
}
