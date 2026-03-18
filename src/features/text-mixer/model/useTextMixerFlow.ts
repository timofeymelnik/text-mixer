import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';

import type { MixError, MixRequest, TextMixerState } from '../types';
import { mixText, MixServiceError, type MixService } from '../services';
import { isValidInput, normalizeInput, toPreview } from '../utils/validation';
import type { TextMixerFlow, UseTextMixerFlowOptions } from './useTextMixerFlow.types';

const INITIAL_STATE: TextMixerState = {
  sourceText: '',
  styleReferenceText: '',
  mode: 'style-transfer',
  status: 'idle',
  result: null,
  error: null,
  hasConfirmedSourceText: false,
};

function toUiError(error: unknown): MixError {
  if (error instanceof MixServiceError) {
    if (error.type === 'network') {
      return { type: 'network', message: 'Network issue. Please retry in a moment.' };
    }

    if (error.type === 'timeout') {
      return { type: 'timeout', message: 'This is taking longer than usual. Try again.' };
    }

    return { type: error.type, message: 'Received an invalid response. Please retry.' };
  }

  return { type: 'network', message: 'Something went wrong. Please retry.' };
}

export function useTextMixerFlow(options: UseTextMixerFlowOptions = {}): TextMixerFlow {
  const mixService: MixService = options.mixService ?? mixText;
  const [state, setState] = useState<TextMixerState>(INITIAL_STATE);
  const requestIdRef = useRef(0);

  const setSourceText = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      sourceText: value,
    }));
  }, []);

  const setStyleReferenceText = useCallback((value: string) => {
    setState((prev) => ({
      ...prev,
      styleReferenceText: value,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      status: prev.status === 'error' ? 'idle' : prev.status,
    }));
  }, []);

  const confirmSourceText = useCallback(() => {
    const normalized = normalizeInput(state.sourceText);
    const valid = isValidInput(normalized);

    if (!valid) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: { type: 'validation', message: 'Please enter a source text before continuing.' },
      }));
      return false;
    }

    setState((prev) => ({
      ...prev,
      sourceText: normalized,
      hasConfirmedSourceText: true,
      error: null,
      status: 'idle',
    }));

    return true;
  }, [state.sourceText]);

  const startMix = useCallback(async () => {
    if (state.status === 'loading') {
      return;
    }

    const normalizedSourceText = normalizeInput(state.sourceText);
    const normalizedStyleReferenceText = normalizeInput(state.styleReferenceText);

    if (!isValidInput(normalizedSourceText) || !isValidInput(normalizedStyleReferenceText)) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: { type: 'validation', message: 'Source text and style reference are both required.' },
      }));
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState((prev) => ({
      ...prev,
      sourceText: normalizedSourceText,
      styleReferenceText: normalizedStyleReferenceText,
      status: 'loading',
      error: null,
      result: null,
    }));

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // No-op on unsupported devices.
    }

    const request: MixRequest = {
      sourceText: normalizedSourceText,
      styleReferenceText: normalizedStyleReferenceText,
      mode: state.mode,
    };

    try {
      const response = await mixService(request, { timeoutMs: 9000 });

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.output?.trim()) {
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: { type: 'invalid_response', message: 'Received an empty result. Retry to continue.' },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        status: 'success',
        result: {
          ...response,
          output: response.output.trim(),
        },
        error: null,
      }));
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: toUiError(error),
      }));
    }
  }, [mixService, state.mode, state.sourceText, state.status, state.styleReferenceText]);

  const retryMix = useCallback(async () => {
    await startMix();
  }, [startMix]);

  const cancelInFlight = useCallback(() => {
    requestIdRef.current += 1;
    setState((prev) => ({
      ...prev,
      status: 'idle',
      error: null,
    }));
  }, []);

  const resetAll = useCallback(() => {
    requestIdRef.current += 1;
    setState(INITIAL_STATE);
  }, []);

  useEffect(() => {
    if (!options.onStatusChange) {
      return;
    }

    options.onStatusChange(state.status, state.error, state.result);
  }, [options, state.error, state.result, state.status]);

  return useMemo(
    () => ({
      state,
      actions: {
        setSourceText,
        setStyleReferenceText,
        confirmSourceText,
        startMix,
        retryMix,
        clearError,
        resetAll,
        cancelInFlight,
      },
      derived: {
        canContinueSourceStep: isValidInput(state.sourceText),
        canContinueReferenceStep: isValidInput(state.styleReferenceText),
        sourcePreview: toPreview(state.sourceText),
      },
    }),
    [
      cancelInFlight,
      confirmSourceText,
      clearError,
      resetAll,
      retryMix,
      setSourceText,
      setStyleReferenceText,
      startMix,
      state,
    ],
  );
}
