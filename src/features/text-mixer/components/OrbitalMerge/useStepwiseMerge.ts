import { useMemo } from 'react';

import type { OrbitalMergePhase } from './OrbitalMerge.types';
import {
  buildRemovedIndices,
  buildScrambleQueue,
  buildTransferSequence,
  clampText,
  getQueueFrame,
  renderCenterGlyphs,
  STEPWISE_MERGE_TIMINGS,
  toSourceGlyphs,
} from './stepwiseMerge.helpers';

type UseStepwiseMergeOptions = {
  elapsedMs: number;
  handoffElapsedMs: number;
  phase: OrbitalMergePhase;
  sourceText: string;
  styleReferenceText: string;
};

export function useStepwiseMerge({
  elapsedMs,
  handoffElapsedMs,
  phase,
  sourceText,
  styleReferenceText,
}: UseStepwiseMergeOptions) {
  const clampedSourceText = useMemo(() => clampText(sourceText), [sourceText]);
  const clampedStyleReferenceText = useMemo(() => clampText(styleReferenceText), [styleReferenceText]);
  const transferSequence = useMemo(
    () => buildTransferSequence(clampedSourceText, clampedStyleReferenceText),
    [clampedSourceText, clampedStyleReferenceText],
  );
  const scrambleQueue = useMemo(() => buildScrambleQueue(transferSequence), [transferSequence]);
  const queueFrame = useMemo(() => getQueueFrame(elapsedMs), [elapsedMs]);

  const labelOpacity = useMemo(() => {
    if (phase === 'error') {
      return 1;
    }

    if (elapsedMs <= STEPWISE_MERGE_TIMINGS.borderFadeMs) {
      return 1 - elapsedMs / STEPWISE_MERGE_TIMINGS.borderFadeMs;
    }

    return 0;
  }, [elapsedMs, phase]);

  const removedText1 = useMemo(() => {
    if (phase === 'error') {
      return new Set<number>();
    }

    return buildRemovedIndices(scrambleQueue, queueFrame, 'text1');
  }, [phase, queueFrame, scrambleQueue]);

  const removedText2 = useMemo(() => {
    if (phase === 'error') {
      return new Set<number>();
    }

    return buildRemovedIndices(scrambleQueue, queueFrame, 'text2');
  }, [phase, queueFrame, scrambleQueue]);

  const sourceGlyphs1 = useMemo(() => toSourceGlyphs(clampedSourceText, removedText1), [clampedSourceText, removedText1]);
  const sourceGlyphs2 = useMemo(
    () => toSourceGlyphs(clampedStyleReferenceText, removedText2),
    [clampedStyleReferenceText, removedText2],
  );
  const centerGlyphs = useMemo(
    () => renderCenterGlyphs(scrambleQueue, queueFrame, phase, handoffElapsedMs),
    [handoffElapsedMs, phase, queueFrame, scrambleQueue],
  );

  return {
    centerGlyphs,
    labelOpacity,
    sourceGlyphs1,
    sourceGlyphs2,
  };
}
