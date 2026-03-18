import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { View } from 'react-native';

import { useTextMixer } from '../../model';
import { useTextInputSharedTransition } from '../../model/TextInputSharedTransition.context';
import type { OrbitalMergePhase } from '../../components';
import { toPreview } from '../../utils/validation';
import { scaleAnimationMs } from '../../model/animationSpeed';
import { MIXING_ANIMATION_TIMINGS, MIXING_MIN_HANDOFF_START_MS } from '../../model/mixingAnimation';
import type { RootStackParamList } from '../../../../navigation/navigation.types';
import type { MixStatus } from '../../types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Mixing'>;
type MixingRoute = RouteProp<RootStackParamList, 'Mixing'>;
const MIXING_ENTRY_SETTLE_MS = scaleAnimationMs(380);

export function getMixingHandoffStartMs(status: MixStatus, successAtMs: number | null) {
  if (status !== 'success') {
    return null;
  }

  return Math.max(MIXING_MIN_HANDOFF_START_MS, successAtMs ?? 0);
}

export function getMixingAnimationPhase(
  status: MixStatus,
  elapsedMs: number,
  handoffStartMs: number | null = getMixingHandoffStartMs(status, 0),
): OrbitalMergePhase {
  if (status === 'error') {
    return 'error';
  }

  if (elapsedMs < MIXING_ANIMATION_TIMINGS.stackedPhaseMs) {
    return 'stacked';
  }

  if (elapsedMs < MIXING_ANIMATION_TIMINGS.convergingPhaseMs) {
    return 'converging';
  }

  if (elapsedMs < MIXING_ANIMATION_TIMINGS.armedPhaseMs) {
    return 'armed';
  }

  if (handoffStartMs !== null && elapsedMs >= handoffStartMs) {
    return 'handoff';
  }

  return 'mixing';
}

export function useMixingScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<MixingRoute>();
  const { state, actions } = useTextMixer();
  const sharedTransition = useTextInputSharedTransition();
  const sourceTargetRef = useRef<View | null>(null);
  const styleReferenceTargetRef = useRef<View | null>(null);
  const animationStartedAtRef = useRef<number | null>(null);
  const resultNavigationTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasNavigatedToResultRef = useRef(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [successAtMs, setSuccessAtMs] = useState<number | null>(null);
  const entryDelayMs = route.params?.handoffFromTextTwo ? MIXING_ENTRY_SETTLE_MS : 0;
  const displayElapsedMs = Math.max(0, elapsedMs - entryDelayMs);

  useEffect(() => {
    if (state.status !== 'loading' && state.status !== 'success') {
      return;
    }

    const updateElapsedMs = () => {
      const startedAt = animationStartedAtRef.current ?? Date.now();

      setElapsedMs(Date.now() - startedAt);
      animationFrameRef.current = requestAnimationFrame(updateElapsedMs) as unknown as number;
    };

    animationFrameRef.current = requestAnimationFrame(updateElapsedMs) as unknown as number;

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state.status]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (resultNavigationTimeoutRef.current !== null) {
        clearTimeout(resultNavigationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (state.status === 'loading') {
      animationStartedAtRef.current = Date.now();
      setElapsedMs(0);
      setSuccessAtMs(null);
      hasNavigatedToResultRef.current = false;
    }

    if (state.status !== 'success') {
      if (resultNavigationTimeoutRef.current !== null) {
        clearTimeout(resultNavigationTimeoutRef.current);
        resultNavigationTimeoutRef.current = null;
      }

      if (state.status !== 'loading') {
        animationStartedAtRef.current = null;
        setSuccessAtMs(null);
      }
    }
  }, [state.status]);

  useEffect(() => {
    if (state.status === 'success' && animationStartedAtRef.current === null) {
      animationStartedAtRef.current = Date.now() - elapsedMs;
    }
  }, [elapsedMs, state.status]);

  useEffect(() => {
    if (state.status === 'success' && successAtMs === null) {
      setSuccessAtMs(displayElapsedMs);
    }
  }, [displayElapsedMs, state.status, successAtMs]);

  const handoffStartMs = useMemo(() => getMixingHandoffStartMs(state.status, successAtMs), [state.status, successAtMs]);

  const animationPhase = useMemo(
    () => getMixingAnimationPhase(state.status, displayElapsedMs, handoffStartMs),
    [displayElapsedMs, handoffStartMs, state.status],
  );

  useEffect(() => {
    if (state.status !== 'success' || handoffStartMs === null || hasNavigatedToResultRef.current) {
      return;
    }

    const navigateToResult = () => {
      if (hasNavigatedToResultRef.current) {
        return;
      }

      hasNavigatedToResultRef.current = true;
      resultNavigationTimeoutRef.current = null;
      navigation.replace('Result');
    };

    const navigationStartMs = handoffStartMs + MIXING_ANIMATION_TIMINGS.handoffDurationMs;
    const remainingMs = navigationStartMs - displayElapsedMs;

    if (remainingMs <= 0) {
      navigateToResult();
      return;
    }

    resultNavigationTimeoutRef.current = setTimeout(navigateToResult, remainingMs) as unknown as number;

    return () => {
      if (resultNavigationTimeoutRef.current !== null) {
        clearTimeout(resultNavigationTimeoutRef.current);
        resultNavigationTimeoutRef.current = null;
      }
    };
  }, [displayElapsedMs, handoffStartMs, navigation, state.status]);

  const onRetry = useCallback(() => {
    setElapsedMs(0);
    actions.retryMix();
  }, [actions]);

  const onBack = useCallback(() => {
    actions.cancelInFlight();
    navigation.replace('TextTwo');
  }, [actions, navigation]);

  const onStyleReferenceTargetLayout = useCallback(() => {
    if (!route.params?.handoffFromTextTwo) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        styleReferenceTargetRef.current?.measureInWindow((x, y, width, height) => {
          if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
            return;
          }

          sharedTransition.registerTargetLayout('text2-preview', { x, y, width, height });
        });
      });
    });
  }, [route.params?.handoffFromTextTwo, sharedTransition]);

  const onSourceTargetLayout = useCallback(() => {
    if (!route.params?.handoffFromTextTwo) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sourceTargetRef.current?.measureInWindow((x, y, width, height) => {
          if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
            return;
          }

          sharedTransition.registerTargetLayout('text1-preview', { x, y, width, height });
        });
      });
    });
  }, [route.params?.handoffFromTextTwo, sharedTransition]);

  return {
    sourcePreview: toPreview(state.sourceText),
    styleReferencePreview: toPreview(state.styleReferenceText),
    isLoading: state.status === 'loading',
    animationPhase,
    handoffElapsedMs: handoffStartMs === null ? 0 : Math.max(0, displayElapsedMs - handoffStartMs),
    isSourceTargetHidden: sharedTransition.isTargetHidden('text1-preview'),
    isStyleReferenceTargetHidden: sharedTransition.isTargetHidden('text2-preview'),
    elapsedMs: displayElapsedMs,
    errorMessage: state.status === 'error' ? state.error?.message ?? 'Something failed.' : null,
    onSourceTargetLayout,
    onStyleReferenceTargetLayout,
    onRetry,
    onBack,
    sourceTargetRef,
    styleReferenceTargetRef,
  };
}
