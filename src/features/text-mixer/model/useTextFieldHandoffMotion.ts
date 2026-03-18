import { useEffect } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scaleAnimationMs } from './animationSpeed';
import { MOTION_CURVES } from './motionCurves';

type UseTextFieldHandoffMotionOptions = {
  expandedHeight: number | null;
  isRunning: boolean;
};

const COLLAPSED_HEIGHT = 116;
const HANDOFF_SHIFT_Y = -8;
const HANDOFF_SHIFT_X = -4;
const HANDOFF_SCALE = 0.992;
const HANDOFF_SURFACE_OPACITY = 0.985;
const HANDOFF_SUPPORTING_SHIFT_Y = 8;
const HANDOFF_DURATION_MS = scaleAnimationMs(360);
const RESET_DURATION_MS = scaleAnimationMs(260);
const CONTENT_FADE_DURATION_MS = scaleAnimationMs(180);
const SUPPORTING_FADE_DURATION_MS = scaleAnimationMs(200);

export function useTextFieldHandoffMotion({ expandedHeight, isRunning }: UseTextFieldHandoffMotionOptions) {
  const height = useSharedValue(expandedHeight ?? COLLAPSED_HEIGHT);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const fieldChromeOpacity = useSharedValue(1);
  const fieldContentOpacity = useSharedValue(1);
  const fieldContentTranslateY = useSharedValue(0);
  const supportingOpacity = useSharedValue(1);
  const supportingTranslateY = useSharedValue(0);
  const actionOpacity = useSharedValue(1);
  const actionTranslateY = useSharedValue(0);

  useEffect(() => {
    if (expandedHeight === null || isRunning) {
      return;
    }

    height.value = expandedHeight;
  }, [expandedHeight, height, isRunning]);

  useEffect(() => {
    if (expandedHeight === null) {
      return;
    }

    if (isRunning) {
      height.value = withTiming(expandedHeight, {
        duration: HANDOFF_DURATION_MS,
        easing: MOTION_CURVES.gentleInOut,
      });
      translateY.value = withTiming(HANDOFF_SHIFT_Y, {
        duration: HANDOFF_DURATION_MS,
        easing: MOTION_CURVES.gentleInOut,
      });
      translateX.value = withTiming(HANDOFF_SHIFT_X, {
        duration: HANDOFF_DURATION_MS,
        easing: MOTION_CURVES.gentleInOut,
      });
      scale.value = withTiming(HANDOFF_SCALE, {
        duration: HANDOFF_DURATION_MS,
        easing: MOTION_CURVES.gentleInOut,
      });
      fieldChromeOpacity.value = withTiming(HANDOFF_SURFACE_OPACITY, {
        duration: SUPPORTING_FADE_DURATION_MS,
        easing: MOTION_CURVES.gentleOut,
      });
      fieldContentOpacity.value = withTiming(0, {
        duration: CONTENT_FADE_DURATION_MS,
        easing: MOTION_CURVES.gentleIn,
      });
      fieldContentTranslateY.value = withTiming(HANDOFF_SUPPORTING_SHIFT_Y, {
        duration: HANDOFF_DURATION_MS,
        easing: MOTION_CURVES.gentleInOut,
      });
      supportingOpacity.value = withTiming(0, {
        duration: SUPPORTING_FADE_DURATION_MS,
        easing: MOTION_CURVES.gentleIn,
      });
      supportingTranslateY.value = withTiming(HANDOFF_SUPPORTING_SHIFT_Y, {
        duration: HANDOFF_DURATION_MS,
        easing: MOTION_CURVES.gentleInOut,
      });
      actionOpacity.value = withTiming(0, {
        duration: CONTENT_FADE_DURATION_MS,
        easing: MOTION_CURVES.gentleIn,
      });
      actionTranslateY.value = withTiming(HANDOFF_SUPPORTING_SHIFT_Y, {
        duration: HANDOFF_DURATION_MS,
        easing: MOTION_CURVES.gentleInOut,
      });
      return;
    }

    height.value = withTiming(expandedHeight, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
    translateY.value = withTiming(0, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
    translateX.value = withTiming(0, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
    scale.value = withTiming(1, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
    fieldChromeOpacity.value = withTiming(1, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
    fieldContentOpacity.value = withTiming(1, {
      duration: scaleAnimationMs(220),
      easing: MOTION_CURVES.gentleOut,
    });
    fieldContentTranslateY.value = withTiming(0, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
    supportingOpacity.value = withTiming(1, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
    supportingTranslateY.value = withTiming(0, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
    actionOpacity.value = withTiming(1, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
    actionTranslateY.value = withTiming(0, {
      duration: RESET_DURATION_MS,
      easing: MOTION_CURVES.gentleOut,
    });
  }, [
    actionOpacity,
    actionTranslateY,
    expandedHeight,
    fieldChromeOpacity,
    fieldContentOpacity,
    fieldContentTranslateY,
    height,
    isRunning,
    scale,
    supportingOpacity,
    supportingTranslateY,
    translateX,
    translateY,
  ]);

  const fieldAnimatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: fieldChromeOpacity.value,
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1,
  }));

  const fieldContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fieldContentOpacity.value,
    transform: [{ translateY: fieldContentTranslateY.value }],
  }));

  const supportingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: supportingOpacity.value,
    transform: [{ translateY: supportingTranslateY.value }],
  }));

  const actionAnimatedStyle = useAnimatedStyle(() => ({
    opacity: actionOpacity.value,
    transform: [{ translateY: actionTranslateY.value }],
  }));

  return {
    actionAnimatedStyle,
    collapsedHeight: COLLAPSED_HEIGHT,
    contentAnimatedStyle,
    fieldContentAnimatedStyle,
    fieldAnimatedStyle,
    supportingAnimatedStyle,
  };
}
