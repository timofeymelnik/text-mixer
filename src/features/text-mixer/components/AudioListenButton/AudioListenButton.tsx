import { useEffect } from 'react';
import { Box, Button } from '@gluestack-ui/themed';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { scaleAnimationMs } from '../../model/animationSpeed';
import { MOTION_CURVES } from '../../model/motionCurves';
import type { AudioListenButtonProps } from './AudioListenButton.types';

const AnimatedView = Animated.View;

function PlayGlyph() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M8 6.5V17.5L17 12L8 6.5Z" fill="#111111" stroke="#111111" strokeLinejoin="round" strokeWidth={1.2} />
    </Svg>
  );
}

type AudioBarsProps = {
  color: string;
  isPlaying: boolean;
  isSynthesizing: boolean;
};

function AudioBars({ color, isPlaying, isSynthesizing }: AudioBarsProps) {
  const firstScale = useSharedValue(0.45);
  const secondScale = useSharedValue(0.75);
  const thirdScale = useSharedValue(0.55);

  useEffect(() => {
    if (isPlaying) {
      firstScale.value = withRepeat(
        withSequence(withTiming(1.02, { duration: scaleAnimationMs(280) }), withTiming(0.52, { duration: scaleAnimationMs(280) })),
        -1,
        false,
      );
      secondScale.value = withDelay(
        scaleAnimationMs(120),
        withRepeat(
          withSequence(
            withTiming(0.62, { duration: scaleAnimationMs(250) }),
            withTiming(1.08, { duration: scaleAnimationMs(250) }),
            withTiming(0.5, { duration: scaleAnimationMs(250) }),
          ),
          -1,
          false,
        ),
      );
      thirdScale.value = withDelay(
        scaleAnimationMs(220),
        withRepeat(
          withSequence(withTiming(0.94, { duration: scaleAnimationMs(300) }), withTiming(0.56, { duration: scaleAnimationMs(300) })),
          -1,
          false,
        ),
      );
      return;
    }

    if (isSynthesizing) {
      firstScale.value = withRepeat(
        withSequence(withTiming(0.74, { duration: scaleAnimationMs(360) }), withTiming(0.48, { duration: scaleAnimationMs(360) })),
        -1,
        false,
      );
      secondScale.value = withDelay(
        scaleAnimationMs(100),
        withRepeat(
          withSequence(withTiming(0.88, { duration: scaleAnimationMs(360) }), withTiming(0.58, { duration: scaleAnimationMs(360) })),
          -1,
          false,
        ),
      );
      thirdScale.value = withDelay(
        scaleAnimationMs(200),
        withRepeat(
          withSequence(withTiming(0.7, { duration: scaleAnimationMs(360) }), withTiming(0.46, { duration: scaleAnimationMs(360) })),
          -1,
          false,
        ),
      );
      return;
    }

    cancelAnimation(firstScale);
    cancelAnimation(secondScale);
    cancelAnimation(thirdScale);
    firstScale.value = withTiming(0.45, { duration: scaleAnimationMs(220), easing: MOTION_CURVES.gentleOut });
    secondScale.value = withTiming(0.75, { duration: scaleAnimationMs(220), easing: MOTION_CURVES.gentleOut });
    thirdScale.value = withTiming(0.55, { duration: scaleAnimationMs(220), easing: MOTION_CURVES.gentleOut });
  }, [firstScale, isPlaying, isSynthesizing, secondScale, thirdScale]);

  const firstStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: firstScale.value }],
  }));
  const secondStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: secondScale.value }],
  }));
  const thirdStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: thirdScale.value }],
  }));

  return (
    <Box flexDirection="row" alignItems="flex-end" justifyContent="center" sx={{ gap: 3 }}>
      <AnimatedView style={firstStyle}>
        <Svg width={4} height={18} viewBox="0 0 4 18" fill="none">
          <Rect width="4" height="18" rx="2" fill={color} />
        </Svg>
      </AnimatedView>
      <AnimatedView style={secondStyle}>
        <Svg width={4} height={18} viewBox="0 0 4 18" fill="none">
          <Rect width="4" height="18" rx="2" fill={color} />
        </Svg>
      </AnimatedView>
      <AnimatedView style={thirdStyle}>
        <Svg width={4} height={18} viewBox="0 0 4 18" fill="none">
          <Rect width="4" height="18" rx="2" fill={color} />
        </Svg>
      </AnimatedView>
    </Box>
  );
}

export function AudioListenButton({
  isDisabled = false,
  isPlaying,
  isSynthesizing,
  onPress,
}: AudioListenButtonProps) {
  const haloScale = useSharedValue(1);
  const haloOpacity = useSharedValue(0);
  const coreScale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      haloOpacity.value = withRepeat(
        withSequence(withTiming(0.18, { duration: scaleAnimationMs(360) }), withTiming(0.08, { duration: scaleAnimationMs(360) })),
        -1,
        false,
      );
      haloScale.value = withRepeat(
        withSequence(
          withTiming(1.14, { duration: scaleAnimationMs(620), easing: MOTION_CURVES.gentleOut }),
          withTiming(1, { duration: scaleAnimationMs(620), easing: MOTION_CURVES.gentleInOut }),
        ),
        -1,
        false,
      );
      coreScale.value = withRepeat(
        withSequence(withTiming(0.985, { duration: scaleAnimationMs(300) }), withTiming(1, { duration: scaleAnimationMs(300) })),
        -1,
        false,
      );
      return;
    }

    if (isSynthesizing) {
      haloOpacity.value = withRepeat(
        withSequence(withTiming(0.14, { duration: scaleAnimationMs(460) }), withTiming(0.05, { duration: scaleAnimationMs(460) })),
        -1,
        false,
      );
      haloScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: scaleAnimationMs(700), easing: MOTION_CURVES.gentleOut }),
          withTiming(1, { duration: scaleAnimationMs(700), easing: MOTION_CURVES.gentleInOut }),
        ),
        -1,
        false,
      );
      coreScale.value = withRepeat(
        withSequence(withTiming(0.99, { duration: scaleAnimationMs(340) }), withTiming(1, { duration: scaleAnimationMs(340) })),
        -1,
        false,
      );
      return;
    }

    cancelAnimation(haloScale);
    cancelAnimation(haloOpacity);
    cancelAnimation(coreScale);
    haloScale.value = withTiming(1, { duration: scaleAnimationMs(220), easing: MOTION_CURVES.gentleOut });
    haloOpacity.value = withTiming(0, { duration: scaleAnimationMs(220), easing: MOTION_CURVES.gentleOut });
    coreScale.value = withTiming(1, { duration: scaleAnimationMs(220), easing: MOTION_CURVES.gentleOut });
  }, [coreScale, haloOpacity, haloScale, isPlaying, isSynthesizing]);

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));
  const coreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));

  const accessibilityLabel = isPlaying ? 'Stop audio playback' : isSynthesizing ? 'Preparing audio playback' : 'Listen to result';
  const iconColor = isPlaying ? '#dc2626' : isSynthesizing ? '#d97706' : '#111111';

  return (
    <Button
      onPress={onPress}
      isDisabled={isDisabled}
      bg="$white"
      borderWidth="$1"
      borderColor="$black"
      borderRadius="$full"
      w="$16"
      h="$16"
      p="$0"
      alignSelf="flex-start"
      accessibilityLabel={accessibilityLabel}
      sx={{
        opacity: isDisabled ? 0.72 : 1,
      }}
    >
      <Box w="$16" h="$16" alignItems="center" justifyContent="center">
        {(isPlaying || isSynthesizing) ? (
          <AnimatedView
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                width: 56,
                height: 56,
                borderRadius: 999,
                backgroundColor: isPlaying ? '#fca5a5' : '#fde68a',
              },
              haloAnimatedStyle,
            ]}
          />
        ) : null}

        <AnimatedView style={coreAnimatedStyle}>
          <Box
            w="$12"
            h="$12"
            borderRadius="$full"
            alignItems="center"
            justifyContent="center"
            bg={isPlaying ? '$error50' : isSynthesizing ? '$warning50' : '$backgroundLight0'}
          >
            {isPlaying || isSynthesizing ? (
              <AudioBars color={iconColor} isPlaying={isPlaying} isSynthesizing={isSynthesizing} />
            ) : (
              <PlayGlyph />
            )}
          </Box>
        </AnimatedView>
      </Box>
    </Button>
  );
}
