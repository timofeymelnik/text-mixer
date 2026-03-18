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
import type { VoiceCaptureButtonProps } from './VoiceCaptureButton.types';

const AnimatedView = Animated.View;

function formatDuration(durationMs = 0) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function MicrophoneGlyph({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3.5" width="6" height="11" rx="3" stroke={color} strokeWidth={1.6} />
      <Path d="M6.5 11.5C6.5 14.5376 8.96243 17 12 17C15.0376 17 17.5 14.5376 17.5 11.5" stroke={color} strokeLinecap="round" strokeWidth={1.6} />
      <Path d="M12 17V20.5" stroke={color} strokeLinecap="round" strokeWidth={1.6} />
      <Path d="M9 20.5H15" stroke={color} strokeLinecap="round" strokeWidth={1.6} />
    </Svg>
  );
}

type VoiceBarsProps = {
  color: string;
  isRecording: boolean;
  isTranscribing: boolean;
};

function VoiceBars({ color, isRecording, isTranscribing }: VoiceBarsProps) {
  const firstScale = useSharedValue(0.45);
  const secondScale = useSharedValue(0.75);
  const thirdScale = useSharedValue(0.55);

  useEffect(() => {
    if (isRecording) {
      firstScale.value = withRepeat(
        withSequence(withTiming(1.02, { duration: scaleAnimationMs(260) }), withTiming(0.5, { duration: scaleAnimationMs(260) })),
        -1,
        false,
      );
      secondScale.value = withDelay(
        scaleAnimationMs(100),
        withRepeat(
          withSequence(
            withTiming(0.6, { duration: scaleAnimationMs(240) }),
            withTiming(1.08, { duration: scaleAnimationMs(240) }),
            withTiming(0.48, { duration: scaleAnimationMs(240) }),
          ),
          -1,
          false,
        ),
      );
      thirdScale.value = withDelay(
        scaleAnimationMs(200),
        withRepeat(
          withSequence(withTiming(0.96, { duration: scaleAnimationMs(280) }), withTiming(0.54, { duration: scaleAnimationMs(280) })),
          -1,
          false,
        ),
      );
      return;
    }

    if (isTranscribing) {
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
  }, [firstScale, isRecording, isTranscribing, secondScale, thirdScale]);

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

export function VoiceCaptureButton({ durationMs, isDisabled = false, onPress, recordingState }: VoiceCaptureButtonProps) {
  const isRecording = recordingState === 'recording';
  const isTranscribing = recordingState === 'transcribing';
  const isError = recordingState === 'error';
  const haloScale = useSharedValue(1);
  const haloOpacity = useSharedValue(0);
  const coreScale = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
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
        withSequence(withTiming(0.985, { duration: scaleAnimationMs(280) }), withTiming(1, { duration: scaleAnimationMs(280) })),
        -1,
        false,
      );
      return;
    }

    if (isTranscribing) {
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
  }, [coreScale, haloOpacity, haloScale, isRecording, isTranscribing]);

  const haloAnimatedStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value,
    transform: [{ scale: haloScale.value }],
  }));
  const coreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: coreScale.value }],
  }));

  const accessibilityLabel = isRecording
    ? `Stop recording. Current duration ${formatDuration(durationMs)}`
    : isTranscribing
      ? 'Transcribing voice input'
      : isError
        ? 'Try voice input again'
        : 'Record voice note';
  const iconColor = isRecording ? '#dc2626' : isTranscribing ? '#d97706' : isError ? '#b91c1c' : '#111111';

  return (
    <Button
      onPress={onPress}
      isDisabled={isDisabled || isTranscribing}
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
        {(isRecording || isTranscribing) ? (
          <AnimatedView
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                width: 56,
                height: 56,
                borderRadius: 999,
                backgroundColor: isRecording ? '#fca5a5' : '#fde68a',
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
            bg={isRecording ? '$error50' : isTranscribing ? '$warning50' : isError ? '$error50' : '$backgroundLight0'}
          >
            {isRecording || isTranscribing ? (
              <VoiceBars color={iconColor} isRecording={isRecording} isTranscribing={isTranscribing} />
            ) : (
              <MicrophoneGlyph color={iconColor} />
            )}
          </Box>
        </AnimatedView>
      </Box>
    </Button>
  );
}
