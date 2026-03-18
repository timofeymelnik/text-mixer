import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
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
import type { RootStackParamList } from '../../../../navigation/navigation.types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'TextOne'>;

const TEXT_ONE_HANDOFF_DELAY_MS = scaleAnimationMs(12);
const TEXT_ONE_NAVIGATION_DELAY_MS = scaleAnimationMs(8);

export function useTextOneScreen() {
  const navigation = useNavigation<Navigation>();
  const { state, actions, derived } = useTextMixer();
  const sharedTransition = useTextInputSharedTransition();
  const [isSourceConfirmedVisible, setSourceConfirmedVisible] = useState(false);
  const [isTransitionPending, setTransitionPending] = useState(false);
  const [isHandingOff, setHandingOff] = useState(false);
  const fieldRef = useRef<View | null>(null);
  const textareaRef = useRef<View | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isInteractionLocked = isTransitionPending || isHandingOff;
  const { measuredHeight: textareaHeight, onLayout: onTextareaLayout } = useMeasuredHeight({ isLocked: isInteractionLocked });
  const introMotion = useTextStepIntro();
  const ctaMotion = useAnimatedCtaState({ isEnabled: derived.canContinueSourceStep });
  const errorMotion = useAnimatedPresence({ isVisible: Boolean(state.error?.type === 'validation'), initialTranslateY: 6 });
  const sourceConfirmedMotion = useAnimatedPresence({
    isVisible: isSourceConfirmedVisible,
    initialTranslateY: 6,
    duration: scaleAnimationMs(180),
  });
  const handoffMotion = useTextFieldHandoffMotion({
    expandedHeight: textareaHeight,
    isRunning: isHandingOff,
  });
  const voiceCapture = useVoiceCapture({
    onTranscribed: (text) => {
      actions.setSourceText(text);
      actions.clearError();
    },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const navigateToTextTwo = useCallback(() => {
    navigation.navigate('TextTwo', { handoffFromTextOne: true });
  }, [navigation]);

  const onContinue = useCallback(() => {
    if (isInteractionLocked) {
      return;
    }

    const hasConfirmedSourceText = actions.confirmSourceText();

    if (!hasConfirmedSourceText) {
      return;
    }

    setTransitionPending(true);
    setSourceConfirmedVisible(true);
    timeoutRef.current = setTimeout(() => {
      const resetPendingHandoff = () => {
        setSourceConfirmedVisible(false);
        setTransitionPending(false);
        setHandingOff(false);
      };
      const continueWithoutSharedTransition = () => {
        resetPendingHandoff();
        navigateToTextTwo();
      };
      const sourceNode = textareaRef.current ?? fieldRef.current;

      if (!sourceNode) {
        continueWithoutSharedTransition();
        return;
      }

      sourceNode.measureInWindow((x, y, width, height) => {
        if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
          continueWithoutSharedTransition();
          return;
        }

        sharedTransition.beginTransition(
          'text1-preview',
          {
            colorScheme: 'overlay',
            label: 'Source text',
            sourceText: state.sourceText.trim(),
            sourceVariant: 'field',
            targetText: derived.sourcePreview,
            targetVariant: 'pill',
          },
          { x, y, width, height },
        );

        requestAnimationFrame(() => {
          setTransitionPending(false);
          setHandingOff(true);
          timeoutRef.current = setTimeout(() => {
            navigateToTextTwo();
          }, TEXT_ONE_NAVIGATION_DELAY_MS) as unknown as number;
        });
      });
    }, TEXT_ONE_HANDOFF_DELAY_MS) as unknown as number;
  }, [actions, derived.sourcePreview, isInteractionLocked, navigateToTextTwo, sharedTransition, state.sourceText]);

  const onChangeSourceText = useCallback(
    (value: string) => {
      actions.setSourceText(value);
      voiceCapture.clearError();
      if (state.error) {
        actions.clearError();
      }
    },
    [actions, state.error, voiceCapture],
  );

  return {
    sourceText: state.sourceText,
    canContinue: derived.canContinueSourceStep,
    collapsedTextareaHeight: handoffMotion.collapsedHeight,
    contentAnimatedStyle: handoffMotion.contentAnimatedStyle,
    fieldContentAnimatedStyle: handoffMotion.fieldContentAnimatedStyle,
    fieldAnimatedStyle: handoffMotion.fieldAnimatedStyle,
    fieldRef,
    textareaRef,
    footerAnimatedStyle: handoffMotion.supportingAnimatedStyle,
    isHandingOff,
    isInteractionLocked,
    errorMessage: state.error?.type === 'validation' ? state.error.message : null,
    ctaAnimatedStyle: ctaMotion.animatedStyle,
    ctaContainerAnimatedStyle: handoffMotion.actionAnimatedStyle,
    ctaIntroAnimatedStyle: introMotion.ctaAnimatedStyle,
    errorAnimatedStyle: errorMotion.animatedStyle,
    fieldIntroAnimatedStyle: introMotion.fieldAnimatedStyle,
    headerIntroAnimatedStyle: introMotion.headerAnimatedStyle,
    isErrorVisible: errorMotion.shouldRender,
    onChangeSourceText,
    onContinue,
    onTextareaLayout,
    metaIntroAnimatedStyle: introMotion.metaAnimatedStyle,
    sourceConfirmedAnimatedStyle: sourceConfirmedMotion.animatedStyle,
    isSourceConfirmationMessageVisible: sourceConfirmedMotion.shouldRender,
    voiceCaptureDurationMs: voiceCapture.durationMs,
    voiceCaptureErrorMessage: voiceCapture.errorMessage,
    isVoiceCaptureBusy: voiceCapture.isBusy,
    voiceCaptureState: voiceCapture.recordingState,
    onVoiceCapturePress: voiceCapture.onPress,
  };
}
