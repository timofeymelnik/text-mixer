import type { RefObject } from 'react';
import type { View } from 'react-native';

import type { OrbitalMergePhase } from './OrbitalMerge.types';

export type StepwiseMergeProps = {
  elapsedMs: number;
  handoffElapsedMs?: number;
  isSourceTargetHidden?: boolean;
  isStyleReferenceTargetHidden?: boolean;
  onSourceTargetLayout?: () => void;
  onStyleReferenceTargetLayout?: () => void;
  phase: OrbitalMergePhase;
  sourceText: string;
  styleReferenceText: string;
  sourceTargetRef?: RefObject<View | null>;
  styleReferenceTargetRef?: RefObject<View | null>;
};
