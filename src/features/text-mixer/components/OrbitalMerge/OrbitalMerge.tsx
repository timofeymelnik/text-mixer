import { VStack } from '@gluestack-ui/themed';

import type { OrbitalMergeProps } from './OrbitalMerge.types';
import { StepwiseMerge } from './StepwiseMerge';

export function OrbitalMerge({
  elapsedMs,
  handoffElapsedMs = 0,
  sourceText,
  styleReferenceText,
  isSourceTargetHidden = false,
  isStyleReferenceTargetHidden = false,
  onSourceTargetLayout,
  onStyleReferenceTargetLayout,
  sourceTargetRef,
  styleReferenceTargetRef,
  phase,
}: OrbitalMergeProps) {
  return (
    <VStack space="xl" alignItems="stretch" w="$full">
      <StepwiseMerge
        elapsedMs={elapsedMs}
        handoffElapsedMs={handoffElapsedMs}
        isSourceTargetHidden={isSourceTargetHidden}
        isStyleReferenceTargetHidden={isStyleReferenceTargetHidden}
        onSourceTargetLayout={onSourceTargetLayout}
        onStyleReferenceTargetLayout={onStyleReferenceTargetLayout}
        phase={phase}
        sourceText={sourceText}
        styleReferenceText={styleReferenceText}
        sourceTargetRef={sourceTargetRef}
        styleReferenceTargetRef={styleReferenceTargetRef}
      />
    </VStack>
  );
}
