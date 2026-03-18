import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { scaleAnimationMs } from './animationSpeed';
import { MOTION_CURVES } from './motionCurves';
import {
  type ActiveTransition,
  type SharedLayout,
  type SharedTransitionColorScheme,
  type SharedTransitionKey,
  type SharedTransitionPayload,
  TextInputSharedTransitionContext,
} from './TextInputSharedTransition.context';

const AnimatedView = Animated.createAnimatedComponent(View);
const TRANSITION_DURATION_MS = scaleAnimationMs(360);
const TRANSITION_OPACITY = 1;
const SOURCE_BORDER_RADIUS = 24;
const TARGET_BORDER_RADIUS = 20;
const VORTEX_SWAY_X = 14;
const VORTEX_SWAY_Y = 18;
const SCALE_OVERSHOOT = 1.018;
const TRANSITION_SWAY_SEGMENT_MS = scaleAnimationMs(140);
const TRANSITION_COMPLETION_BUFFER_MS = scaleAnimationMs(24);
const STALE_TRANSITION_CHECK_MS = scaleAnimationMs(120);
const MAX_PENDING_TARGET_MS = scaleAnimationMs(420);
const MAX_TRANSITION_LIFETIME_MS = scaleAnimationMs(2200);

type TransitionCardVariant = 'field' | 'pill' | 'block';
type TransitionCardMetrics = ReturnType<typeof getVariantMetrics>;

function getTransitionDirection(key: SharedTransitionKey) {
  return key === 'text2-preview' ? -1 : 1;
}

function replaceTransition(previous: ActiveTransition[], nextTransition: ActiveTransition) {
  return [...previous.filter((transition) => transition.key !== nextTransition.key), nextTransition];
}

function attachTargetLayout(previous: ActiveTransition[], key: SharedTransitionKey, layout: SharedLayout) {
  return previous.map((transition) =>
    transition.key === key
      ? {
          ...transition,
          targetLayout: layout,
        }
      : transition,
  );
}

function shouldKeepTransition(transition: ActiveTransition, now: number) {
  const ageMs = now - transition.createdAt;

  if (transition.targetLayout === null) {
    return ageMs < MAX_PENDING_TARGET_MS;
  }

  return ageMs < MAX_TRANSITION_LIFETIME_MS;
}

function pruneExpiredTransitions(previous: ActiveTransition[], now: number) {
  const nextTransitions = previous.filter((transition) => shouldKeepTransition(transition, now));

  return nextTransitions.length === previous.length ? previous : nextTransitions;
}

function getTransitionConfig(sourceVariant: TransitionCardVariant, targetVariant: TransitionCardVariant) {
  if (sourceVariant === 'field' && targetVariant === 'pill') {
    return {
      durationMs: scaleAnimationMs(220),
      holdAtTargetMs: scaleAnimationMs(180),
      overshootScale: 1.01,
      swayX: 6,
      swayY: 8,
    };
  }

  return {
    durationMs: TRANSITION_DURATION_MS,
    holdAtTargetMs: 0,
    overshootScale: SCALE_OVERSHOOT,
    swayX: VORTEX_SWAY_X,
    swayY: VORTEX_SWAY_Y,
  };
}

function isValidLayout(layout: SharedLayout) {
  return (
    Number.isFinite(layout.x) &&
    Number.isFinite(layout.y) &&
    Number.isFinite(layout.width) &&
    Number.isFinite(layout.height) &&
    layout.width > 0 &&
    layout.height > 0
  );
}

function getSharedTransitionStyles(colorScheme: SharedTransitionColorScheme) {
  if (colorScheme === 'overlay') {
    return {
      backgroundColor: '$white' as const,
      borderColor: '$white' as const,
      shadowColor: '$black' as const,
      textColor: '$black' as const,
      toneColor: '$black' as const,
    };
  }

  if (colorScheme === 'secondary') {
    return {
      backgroundColor: '$secondary100' as const,
      borderColor: '$white' as const,
      shadowColor: '$secondary700' as const,
      textColor: '$secondary900' as const,
      toneColor: '$secondary700' as const,
    };
  }

  return {
    backgroundColor: '$primary100' as const,
    borderColor: '$white' as const,
    shadowColor: '$primary700' as const,
    textColor: '$primary900' as const,
    toneColor: '$primary700' as const,
  };
}

function getVariantMetrics(variant: TransitionCardVariant) {
  if (variant === 'field') {
    return {
      borderRadius: '$xl' as const,
      labelVisible: false,
      paddingX: '$4' as const,
      paddingY: '$4' as const,
      textColor: '$textLight900' as const,
      textLineHeight: '$xl' as const,
      textSize: 'lg' as const,
      textWeight: '$normal' as const,
      verticalSpace: undefined,
    };
  }

  if (variant === 'block') {
    return {
      borderRadius: '$xl' as const,
      labelVisible: true,
      paddingX: '$4' as const,
      paddingY: '$4' as const,
      textColor: '$black' as const,
      textLineHeight: '$lg' as const,
      textSize: 'sm' as const,
      textWeight: '$normal' as const,
      verticalSpace: 'sm' as const,
    };
  }

  return {
    borderRadius: '$xl' as const,
    labelVisible: true,
    paddingX: '$4' as const,
    paddingY: '$3' as const,
    textColor: '$black' as const,
    textLineHeight: '$lg' as const,
    textSize: 'sm' as const,
    textWeight: '$normal' as const,
    verticalSpace: 'sm' as const,
  };
}

function TransitionCardLayer({
  animatedStyle,
  label,
  labelColor,
  metrics,
  numberOfLines,
  text,
  textColor,
}: {
  animatedStyle: StyleProp<ViewStyle>;
  label: string;
  labelColor: string;
  metrics: TransitionCardMetrics;
  numberOfLines?: number;
  text: string;
  textColor: string;
}) {
  return (
    <AnimatedView style={[StyleSheet.absoluteFillObject, animatedStyle]}>
      <Box flex={1} borderRadius={metrics.borderRadius} px={metrics.paddingX} py={metrics.paddingY}>
        <VStack space={metrics.verticalSpace} flex={1}>
          {metrics.labelVisible ? (
            <Text size="xs" color={labelColor} fontWeight="$medium">
              {label}
            </Text>
          ) : null}
          <Text
            size={metrics.textSize}
            color={textColor}
            lineHeight={metrics.textLineHeight}
            fontWeight={metrics.textWeight}
            numberOfLines={numberOfLines}
          >
            {text}
          </Text>
        </VStack>
      </Box>
    </AnimatedView>
  );
}

function TextInputSharedTransitionOverlay({
  onComplete,
  transition,
}: {
  onComplete: () => void;
  transition: ActiveTransition;
}) {
  const transitionConfig = useMemo(
    () => getTransitionConfig(transition.payload.sourceVariant, transition.payload.targetVariant),
    [transition.payload.sourceVariant, transition.payload.targetVariant],
  );
  const opacity = useSharedValue(TRANSITION_OPACITY);
  const morphProgress = useSharedValue(0);
  const left = useSharedValue(transition.sourceLayout.x);
  const top = useSharedValue(transition.sourceLayout.y);
  const width = useSharedValue(transition.sourceLayout.width);
  const height = useSharedValue(transition.sourceLayout.height);
  const borderRadius = useSharedValue(SOURCE_BORDER_RADIUS);
  const scale = useSharedValue(1);
  const swirlX = useSharedValue(0);
  const swirlY = useSharedValue(0);
  const didStartRef = useRef(false);
  const transitionDirection = getTransitionDirection(transition.key);
  const { payload, sourceLayout, targetLayout } = transition;

  useEffect(() => {
    left.value = sourceLayout.x;
    top.value = sourceLayout.y;
    width.value = sourceLayout.width;
    height.value = sourceLayout.height;
    borderRadius.value = SOURCE_BORDER_RADIUS;
    scale.value = 1;
    swirlX.value = 0;
    swirlY.value = 0;
    opacity.value = TRANSITION_OPACITY;
    morphProgress.value = 0;
    didStartRef.current = false;
  }, [
    borderRadius,
    height,
    left,
    opacity,
    morphProgress,
    scale,
    swirlX,
    swirlY,
    sourceLayout.height,
    sourceLayout.width,
    sourceLayout.x,
    sourceLayout.y,
    top,
    width,
  ]);

  useEffect(() => {
    if (!targetLayout || didStartRef.current) {
      return;
    }

    if (!isValidLayout(targetLayout)) {
      onComplete();
      return;
    }

    const swayDurationMs = Math.min(TRANSITION_SWAY_SEGMENT_MS, transitionConfig.durationMs);
    const settleDurationMs = Math.max(0, transitionConfig.durationMs - swayDurationMs);

    didStartRef.current = true;
    left.value = withTiming(targetLayout.x, {
      duration: transitionConfig.durationMs,
      easing: MOTION_CURVES.gentleInOut,
    });
    top.value = withTiming(targetLayout.y, {
      duration: transitionConfig.durationMs,
      easing: MOTION_CURVES.gentleInOut,
    });
    width.value = withTiming(targetLayout.width, {
      duration: transitionConfig.durationMs,
      easing: MOTION_CURVES.gentleInOut,
    });
    height.value = withTiming(targetLayout.height, {
      duration: transitionConfig.durationMs,
      easing: MOTION_CURVES.gentleInOut,
    });
    borderRadius.value = withTiming(TARGET_BORDER_RADIUS, {
      duration: transitionConfig.durationMs,
      easing: MOTION_CURVES.gentleInOut,
    });
    opacity.value = withTiming(1, {
      duration: transitionConfig.durationMs,
      easing: MOTION_CURVES.gentleOut,
    });
    morphProgress.value = withTiming(1, {
      duration: transitionConfig.durationMs,
      easing: MOTION_CURVES.gentleInOut,
    });
    swirlX.value = withSequence(
      withTiming(transitionDirection * transitionConfig.swayX, {
        duration: swayDurationMs,
        easing: MOTION_CURVES.gentleOut,
      }),
      withTiming(0, {
        duration: settleDurationMs,
        easing: MOTION_CURVES.gentleInOut,
      }),
    );
    swirlY.value = withSequence(
      withTiming(-transitionConfig.swayY, {
        duration: swayDurationMs,
        easing: MOTION_CURVES.gentleOut,
      }),
      withTiming(0, {
        duration: settleDurationMs,
        easing: MOTION_CURVES.gentleInOut,
      }),
    );
    scale.value = withSequence(
      withTiming(transitionConfig.overshootScale, {
        duration: swayDurationMs,
        easing: MOTION_CURVES.gentleOut,
      }),
      withTiming(1, {
        duration: settleDurationMs,
        easing: MOTION_CURVES.gentleInOut,
      }),
    );

    const timeoutId = setTimeout(() => {
      onComplete();
    }, transitionConfig.durationMs + transitionConfig.holdAtTargetMs + TRANSITION_COMPLETION_BUFFER_MS);

    return () => clearTimeout(timeoutId);
  }, [
    borderRadius,
    height,
    left,
    morphProgress,
    onComplete,
    opacity,
    scale,
    swirlX,
    swirlY,
    targetLayout,
    top,
    transitionConfig,
    transitionDirection,
    width,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderRadius: borderRadius.value,
    height: height.value,
    left: left.value + swirlX.value,
    opacity: opacity.value,
    position: 'absolute',
    top: top.value + swirlY.value,
    transform: [{ scale: scale.value }],
    width: width.value,
  }));

  const colors = getSharedTransitionStyles(payload.colorScheme);
  const sourceVariant = getVariantMetrics(payload.sourceVariant);
  const targetVariant = getVariantMetrics(payload.targetVariant);
  const sourceLayerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - morphProgress.value,
  }));
  const targetLayerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: morphProgress.value,
  }));

  return (
    <AnimatedView pointerEvents="none" style={[styles.overlayCard, animatedStyle]}>
      <Box
        flex={1}
        bg={colors.backgroundColor}
        borderWidth="$1"
        borderColor={colors.borderColor}
        borderRadius="$xl"
        sx={{
          shadowColor: colors.shadowColor,
          shadowOpacity: payload.colorScheme === 'overlay' ? 0 : 0.1,
          shadowRadius: 12,
          elevation: payload.colorScheme === 'overlay' ? 0 : 4,
        }}
      >
        <TransitionCardLayer
          animatedStyle={sourceLayerAnimatedStyle}
          label={payload.label}
          labelColor={colors.toneColor}
          metrics={sourceVariant}
          text={payload.sourceText}
          textColor={sourceVariant.textColor}
        />
        <TransitionCardLayer
          animatedStyle={targetLayerAnimatedStyle}
          label={payload.label}
          labelColor={colors.toneColor}
          metrics={targetVariant}
          numberOfLines={payload.targetVariant === 'field' ? undefined : 3}
          text={payload.targetText}
          textColor={colors.textColor}
        />
      </Box>
    </AnimatedView>
  );
}

export function TextInputSharedTransitionProvider({ children }: PropsWithChildren) {
  const [activeTransitions, setActiveTransitions] = useState<ActiveTransition[]>([]);

  const beginTransition = useCallback(
    (key: SharedTransitionKey, payload: SharedTransitionPayload, sourceLayout: SharedLayout) => {
      if (!isValidLayout(sourceLayout)) {
        return;
      }

      setActiveTransitions((previous) =>
        replaceTransition(previous, {
          createdAt: Date.now(),
          key,
          payload,
          sourceLayout,
          targetLayout: null,
        }),
      );
    },
    [],
  );

  const clearAllTransitions = useCallback(() => {
    setActiveTransitions((previous) => (previous.length === 0 ? previous : []));
  }, []);

  const registerTargetLayout = useCallback((key: SharedTransitionKey, layout: SharedLayout) => {
    if (!isValidLayout(layout)) {
      return;
    }

    setActiveTransitions((previous) => attachTargetLayout(previous, key, layout));
  }, []);

  const completeTransition = useCallback((key: SharedTransitionKey) => {
    setActiveTransitions((previous) => previous.filter((transition) => transition.key !== key));
  }, []);

  const isTargetHidden = useCallback(
    (key: SharedTransitionKey) =>
      activeTransitions.some((transition) => transition.key === key && transition.targetLayout !== null),
    [activeTransitions],
  );

  const value = useMemo(
    () => ({
      activeTransitions,
      beginTransition,
      clearAllTransitions,
      completeTransition,
      isTargetHidden,
      registerTargetLayout,
    }),
    [activeTransitions, beginTransition, clearAllTransitions, completeTransition, isTargetHidden, registerTargetLayout],
  );

  useEffect(() => {
    if (activeTransitions.length === 0) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setActiveTransitions((previous) => pruneExpiredTransitions(previous, Date.now()));
    }, STALE_TRANSITION_CHECK_MS);

    return () => clearTimeout(timeoutId);
  }, [activeTransitions]);

  return (
    <TextInputSharedTransitionContext.Provider value={value}>
      {children}
      {activeTransitions.length > 0 ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {activeTransitions.map((transition) => (
            <TextInputSharedTransitionOverlay
              key={transition.key}
              onComplete={() => completeTransition(transition.key)}
              transition={transition}
            />
          ))}
        </View>
      ) : null}
    </TextInputSharedTransitionContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlayCard: {
    overflow: 'hidden',
  },
});
