import type { RefObject } from 'react';
import type { View } from 'react-native';

export type OrbitalMergeProps = {
  elapsedMs: number;
  handoffElapsedMs?: number;
  sourceText: string;
  styleReferenceText: string;
  phase: OrbitalMergePhase;
  isSourceTargetHidden?: boolean;
  isStyleReferenceTargetHidden?: boolean;
  onSourceTargetLayout?: () => void;
  onStyleReferenceTargetLayout?: () => void;
  sourceTargetRef?: RefObject<View | null>;
  styleReferenceTargetRef?: RefObject<View | null>;
};

export type OrbitalMergePhase = 'stacked' | 'converging' | 'armed' | 'mixing' | 'handoff' | 'error';
