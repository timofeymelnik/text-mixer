import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { View } from 'react-native';

import {
  scaleAnimationMs,
  useAnimatedCtaState,
  useAnimatedPresence,
  useMeasuredHeight,
  useVoiceCapture,
  useTextFieldHandoffMotion,
  useTextMixer,
  useTextStepIntro,
} from '../../model';
import { useTextInputSharedTransition } from '../../model/TextInputSharedTransition.context';
import { toPreview } from '../../utils/validation';
import type { RootStackParamList } from '../../../../navigation/navigation.types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'TextTwo'>;
type TextTwoRoute = RouteProp<RootStackParamList, 'TextTwo'>;

const TEXT_TWO_HANDOFF_DELAY_MS = scaleAnimationMs(24);
const TEXT_TWO_POST_HANDOFF_DELAY_MS = scaleAnimationMs(380);
const TEXT_TWO_INTRO_STAGGER_MS = scaleAnimationMs(90);
const TEXT_TWO_NAVIGATION_DELAY_MS = scaleAnimationMs(48);

export function useTextTwoScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<TextTwoRoute>();
  const { state, actions, derived } = useTextMixer();
  const sharedTransition = useTextInputSharedTransition();
  const textPillRef = useRef<View | null>(null);
  const fieldRef = useRef<View | null>(null);
  const textareaRef = useRef<View | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [isHandingOff, setHandingOff] = useState(false);
  const { measuredHeight: textareaHeight, onLayout: onTextareaLayout } = useMeasuredHeight({ isLocked: isHandingOff });
  const introMotion = useTextStepIntro({
    autoStart: false,
    initialVisibility: route.params?.handoffFromTextOne ? 'hidden' : 'visible',
    staggerMs: TEXT_TWO_INTRO_STAGGER_MS,
    startDelayMs: TEXT_TWO_POST_HANDOFF_DELAY_MS,
  });
  const canMix = derived.canContinueReferenceStep && state.hasConfirmedSourceText;
  const ctaMotion = useAnimatedCtaState({ isEnabled: canMix });
  const errorMotion = useAnimatedPresence({ isVisible: Boolean(state.error?.type === 'validation'), initialTranslateY: 6 });
  const textPillMotion = useAnimatedPresence({
    isVisible: state.hasConfirmedSourceText,
    initialTranslateX: route.params?.handoffFromTextOne ? -12 : 0,
    initialTranslateY: route.params?.handoffFromTextOne ? -8 : 10,
    hiddenScale: route.params?.handoffFromTextOne ? 0.97 : 0.96,
    duration: route.params?.handoffFromTextOne ? scaleAnimationMs(320) : scaleAnimationMs(260),
  });
  const handoffMotion = useTextFieldHandoffMotion({
    expandedHeight: textareaHeight,
    isRunning: isHandingOff,
  });
  const voiceCapture = useVoiceCapture({
    onTranscribed: (text) => {
      actions.setStyleReferenceText(text);
      actions.clearError();
    },
  });
  const shouldHideSharedPreview = sharedTransition.isTargetHidden('text1-preview');

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onMix = useCallback(() => {
    setHandingOff(true);
    timeoutRef.current = setTimeout(() => {
      let pendingMeasurements = state.hasConfirmedSourceText ? 2 : 1;

      const completeMeasurement = () => {
        pendingMeasurements -= 1;

        if (pendingMeasurements > 0) {
          return;
        }

        timeoutRef.current = setTimeout(() => {
          actions.startMix();
          navigation.navigate('Mixing', { handoffFromTextTwo: true });
        }, TEXT_TWO_NAVIGATION_DELAY_MS) as unknown as number;
      };

      if (state.hasConfirmedSourceText) {
        if (!textPillRef.current) {
          completeMeasurement();
        } else {
          textPillRef.current.measureInWindow((x, y, width, height) => {
            if ([x, y, width, height].every(Number.isFinite) && width > 0 && height > 0) {
              sharedTransition.beginTransition(
                'text1-preview',
                {
                  colorScheme: 'overlay',
                  label: 'Source text',
                  sourceText: derived.sourcePreview,
                  sourceVariant: 'pill',
                  targetText: derived.sourcePreview,
                  targetVariant: 'block',
                },
                { x, y, width, height },
              );
            }

            completeMeasurement();
          });
        }
      }

      const sourceNode = textareaRef.current ?? fieldRef.current;

      if (!sourceNode) {
        completeMeasurement();
      } else {
        sourceNode.measureInWindow((x, y, width, height) => {
          if ([x, y, width, height].every(Number.isFinite) && width > 0 && height > 0) {
            sharedTransition.beginTransition(
              'text2-preview',
              {
                colorScheme: 'overlay',
                label: 'Style reference',
                sourceText: state.styleReferenceText.trim(),
                sourceVariant: 'field',
                targetText: toPreview(state.styleReferenceText),
                targetVariant: 'block',
              },
              { x, y, width, height },
            );
          }

          completeMeasurement();
        });
      }
    }, TEXT_TWO_HANDOFF_DELAY_MS) as unknown as number;
  }, [actions, derived.sourcePreview, navigation, sharedTransition, state.hasConfirmedSourceText, state.styleReferenceText]);

  const onChangeStyleReferenceText = useCallback(
    (value: string) => {
      actions.setStyleReferenceText(value);
      voiceCapture.clearError();
      if (state.error) {
        actions.clearError();
      }
    },
    [actions, state.error, voiceCapture],
  );

  const onTextPillLayout = useCallback(() => {
    if (!route.params?.handoffFromTextOne) {
      return;
    }

    const registerLayout = () => {
      textPillRef.current?.measureInWindow((x, y, width, height) => {
        if ([x, y, width, height].every(Number.isFinite) && width > 0 && height > 0) {
          sharedTransition.registerTargetLayout('text1-preview', { x, y, width, height });
          introMotion.startIntro();
          return;
        }

        requestAnimationFrame(() => {
          textPillRef.current?.measureInWindow((nextX, nextY, nextWidth, nextHeight) => {
            if ([nextX, nextY, nextWidth, nextHeight].every(Number.isFinite) && nextWidth > 0 && nextHeight > 0) {
              sharedTransition.registerTargetLayout('text1-preview', {
                x: nextX,
                y: nextY,
                width: nextWidth,
                height: nextHeight,
              });
            }

            introMotion.startIntro();
          });
        });
      });
    };

    registerLayout();
  }, [introMotion, route.params?.handoffFromTextOne, sharedTransition]);

  return {
    sourcePreview: derived.sourcePreview,
    styleReferenceText: state.styleReferenceText,
    canMix,
    ctaAnimatedStyle: ctaMotion.animatedStyle,
    ctaContainerAnimatedStyle: handoffMotion.actionAnimatedStyle,
    ctaIntroAnimatedStyle: introMotion.ctaAnimatedStyle,
    contentAnimatedStyle: handoffMotion.contentAnimatedStyle,
    errorMessage: state.error?.type === 'validation' ? state.error.message : null,
    errorAnimatedStyle: errorMotion.animatedStyle,
    fieldAnimatedStyle: handoffMotion.fieldAnimatedStyle,
    fieldContentAnimatedStyle: handoffMotion.fieldContentAnimatedStyle,
    fieldIntroAnimatedStyle: introMotion.fieldAnimatedStyle,
    fieldRef,
    textareaRef,
    footerAnimatedStyle: handoffMotion.supportingAnimatedStyle,
    headerIntroAnimatedStyle: introMotion.headerAnimatedStyle,
    isHandingOff,
    isErrorVisible: errorMotion.shouldRender,
    isTextPillVisible: textPillMotion.shouldRender,
    metaIntroAnimatedStyle: introMotion.metaAnimatedStyle,
    introVisibleSections: introMotion.visibleSections,
    onTextPillLayout,
    onTextareaLayout,
    textPillAnimatedStyle: textPillMotion.animatedStyle,
    textPillRef,
    shouldHideSharedPreview,
    onChangeStyleReferenceText,
    onMix,
    voiceCaptureDurationMs: voiceCapture.durationMs,
    voiceCaptureErrorMessage: voiceCapture.errorMessage,
    isVoiceCaptureBusy: voiceCapture.isBusy,
    voiceCaptureState: voiceCapture.recordingState,
    onVoiceCapturePress: voiceCapture.onPress,
  };
}
