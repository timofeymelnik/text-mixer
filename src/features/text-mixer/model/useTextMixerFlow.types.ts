import type { MixError, MixResponse, MixStatus, TextMixerState } from '../types';
import type { MixService } from '../services';

export type TextMixerActions = {
  setSourceText: (value: string) => void;
  setStyleReferenceText: (value: string) => void;
  confirmSourceText: () => boolean;
  startMix: () => Promise<void>;
  retryMix: () => Promise<void>;
  clearError: () => void;
  resetAll: () => void;
  cancelInFlight: () => void;
};

export type TextMixerDerived = {
  canContinueSourceStep: boolean;
  canContinueReferenceStep: boolean;
  sourcePreview: string;
};

export type TextMixerFlow = {
  state: TextMixerState;
  actions: TextMixerActions;
  derived: TextMixerDerived;
};

export type UseTextMixerFlowOptions = {
  mixService?: MixService;
  onStatusChange?: (status: MixStatus, error: MixError | null, result: MixResponse | null) => void;
};
