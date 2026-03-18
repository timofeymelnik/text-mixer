import { useEffect, useRef, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scaleAnimationMs } from './animationSpeed';
import { MOTION_CURVES } from './motionCurves';

type UseAnimatedPresenceOptions = {
  isVisible: boolean;
  duration?: number;
  initialTranslateX?: number;
  initialTranslateY?: number;
  hiddenScale?: number;
  visibleScale?: number;
};

export function useAnimatedPresence({
  isVisible,
  duration = scaleAnimationMs(220),
  initialTranslateX = 0,
  initialTranslateY = 8,
  hiddenScale = 0.98,
  visibleScale = 1,
}: UseAnimatedPresenceOptions) {
  const [shouldRender, setShouldRender] = useState(isVisible);
  const timeoutRef = useRef<number | null>(null);
  const opacity = useSharedValue(isVisible ? 1 : 0);
  const translateX = useSharedValue(isVisible ? 0 : initialTranslateX);
  const translateY = useSharedValue(isVisible ? 0 : initialTranslateY);
  const scale = useSharedValue(isVisible ? visibleScale : hiddenScale);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isVisible) {
      setShouldRender(true);
      opacity.value = withTiming(1, { duration, easing: MOTION_CURVES.gentleOut });
      translateX.value = withTiming(0, { duration, easing: MOTION_CURVES.gentleOut });
      translateY.value = withTiming(0, { duration, easing: MOTION_CURVES.gentleOut });
      scale.value = withTiming(visibleScale, { duration, easing: MOTION_CURVES.gentleOut });
      return;
    }

    opacity.value = withTiming(0, { duration, easing: MOTION_CURVES.gentleIn });
    translateX.value = withTiming(initialTranslateX, { duration, easing: MOTION_CURVES.gentleIn });
    translateY.value = withTiming(initialTranslateY, { duration, easing: MOTION_CURVES.gentleIn });
    scale.value = withTiming(hiddenScale, { duration, easing: MOTION_CURVES.gentleIn });

    timeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      timeoutRef.current = null;
    }, duration) as unknown as number;
  }, [duration, hiddenScale, initialTranslateX, initialTranslateY, isVisible, opacity, scale, translateX, translateY, visibleScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return {
    animatedStyle,
    shouldRender,
  };
}
