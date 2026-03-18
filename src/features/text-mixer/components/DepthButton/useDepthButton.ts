import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scaleAnimationMs } from '../../model/animationSpeed';
import { MOTION_CURVES } from '../../model/motionCurves';

type UseDepthButtonOptions = {
  isDisabled: boolean;
};

const REST_OFFSET = -4;
const PRESSED_OFFSET = -1;

export function useDepthButton({ isDisabled }: UseDepthButtonOptions) {
  const translateY = useSharedValue(REST_OFFSET);

  const onPressIn = useCallback(() => {
    if (isDisabled) {
      return;
    }

    translateY.value = withTiming(PRESSED_OFFSET, {
      duration: scaleAnimationMs(110),
      easing: MOTION_CURVES.gentleOut,
    });
  }, [isDisabled, translateY]);

  const onPressOut = useCallback(() => {
    translateY.value = withTiming(REST_OFFSET, {
      duration: scaleAnimationMs(180),
      easing: MOTION_CURVES.gentleOut,
    });
  }, [translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return {
    animatedStyle,
    onPressIn,
    onPressOut,
  };
}
