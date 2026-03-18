import { renderHook } from '@testing-library/react-native';

import { useStepwiseMerge } from './useStepwiseMerge';
import {
  buildScrambleQueue,
  buildTransferSequence,
  clampText,
  getHandoffWordDeleteStepMs,
  STEPWISE_MERGE_TIMINGS,
} from './stepwiseMerge.helpers';

type HookProps = {
  elapsedMs: number;
  handoffElapsedMs?: number;
};

function toElapsedMs(frame: number) {
  return STEPWISE_MERGE_TIMINGS.queueStartMs + frame * STEPWISE_MERGE_TIMINGS.frameMs + 1;
}

describe('useStepwiseMerge', () => {
  const sourceText = 'alpha beta';
  const styleReferenceText = 'gamma delta';
  const sequence = buildTransferSequence(clampText(sourceText), clampText(styleReferenceText));
  const queue = buildScrambleQueue(sequence);
  const firstItem = queue[0]!;
  const maxEndFrame = queue.reduce((maxFrame, item) => Math.max(maxFrame, item.endFrame), 0);
  const finalResolvedText = sequence.map((item) => item.word).join(' ');

  it('reveals center glyphs progressively instead of showing them all at once', () => {
    const { result } = renderHook(() =>
      useStepwiseMerge({
        elapsedMs: toElapsedMs(firstItem.startFrame),
        handoffElapsedMs: 0,
        phase: 'mixing',
        sourceText,
        styleReferenceText,
      }),
    );

    const visibleGlyphs = result.current.centerGlyphs.filter((glyph) => glyph.char.trim().length > 0);

    expect(visibleGlyphs.length).toBeGreaterThan(0);
    expect(visibleGlyphs.length).toBeLessThan(finalResolvedText.replace(/\s/g, '').length);
  });

  it('holds scramble glyphs for multiple frames to avoid nervous flicker', () => {
    const firstFrame = toElapsedMs(firstItem.startFrame);
    const nextFrame = toElapsedMs(firstItem.startFrame + 1);
    const { result, rerender } = renderHook<ReturnType<typeof useStepwiseMerge>, HookProps>(
      ({ elapsedMs }) =>
        useStepwiseMerge({
          elapsedMs,
          handoffElapsedMs: 0,
          phase: 'mixing',
          sourceText,
          styleReferenceText,
        }),
      { initialProps: { elapsedMs: firstFrame } },
    );

    const initialGlyph = result.current.centerGlyphs[0];

    rerender({ elapsedMs: nextFrame });

    expect(initialGlyph?.tone).toBe('mixing');
    expect(result.current.centerGlyphs[0]?.tone).toBe('mixing');
    expect(result.current.centerGlyphs[0]?.char).toBe(initialGlyph?.char);
  });

  it('resolves into the full interleaved center text over time', () => {
    const { result, rerender } = renderHook<ReturnType<typeof useStepwiseMerge>, HookProps>(
      ({ elapsedMs }) =>
        useStepwiseMerge({
          elapsedMs,
          handoffElapsedMs: 0,
          phase: 'mixing',
          sourceText,
          styleReferenceText,
        }),
      { initialProps: { elapsedMs: toElapsedMs(firstItem.endFrame) } },
    );

    const earlyResolved = result.current.centerGlyphs.filter((glyph) => glyph.tone === 'resolved' && glyph.char.trim().length > 0).length;

    rerender({ elapsedMs: toElapsedMs(maxEndFrame + 1) });

    const finalText = result.current.centerGlyphs.map((glyph) => glyph.char).join('');

    expect(earlyResolved).toBeGreaterThan(0);
    expect(earlyResolved).toBeLessThan(finalResolvedText.length);
    expect(finalText).toHaveLength(finalResolvedText.length);
    expect(finalText).not.toBe(finalResolvedText.replace(/[^\s]/g, ' '));
  });

  it('keeps subtle scramble motion alive after the queue has resolved but before handoff', () => {
    const firstLateFrame = maxEndFrame + STEPWISE_MERGE_TIMINGS.settleFrames;
    const { result, rerender } = renderHook<ReturnType<typeof useStepwiseMerge>, HookProps>(
      ({ elapsedMs }) =>
        useStepwiseMerge({
          elapsedMs,
          handoffElapsedMs: 0,
          phase: 'mixing',
          sourceText,
          styleReferenceText,
        }),
      { initialProps: { elapsedMs: toElapsedMs(firstLateFrame) } },
    );

    for (let frameOffset = 0; frameOffset < 8; frameOffset += 1) {
      rerender({
        elapsedMs: toElapsedMs(firstLateFrame + frameOffset * STEPWISE_MERGE_TIMINGS.dudHoldFrames),
      });

      expect(result.current.centerGlyphs.some((glyph) => glyph.tone === 'mixing')).toBe(true);
    }
  });

  it('deletes center text word by word with a cursor once handoff starts', () => {
    const lateFrame = maxEndFrame + STEPWISE_MERGE_TIMINGS.settleFrames + STEPWISE_MERGE_TIMINGS.dudHoldFrames * 12;
    const finalWords = finalResolvedText.split(' ');
    const deleteStepMs = getHandoffWordDeleteStepMs(finalWords.length);
    const visibleCursorElapsedMs = Array.from({ length: deleteStepMs }, (_, offset) => deleteStepMs + offset + 1).find(
      (elapsedMs) =>
        elapsedMs < deleteStepMs * 2 &&
        Math.floor(elapsedMs / STEPWISE_MERGE_TIMINGS.handoffCursorBlinkMs) % 2 === 0,
    );
    const { result, rerender } = renderHook<ReturnType<typeof useStepwiseMerge>, HookProps>(
      ({ elapsedMs, handoffElapsedMs = 0 }) =>
        useStepwiseMerge({
          elapsedMs,
          handoffElapsedMs,
          phase: 'handoff',
          sourceText,
          styleReferenceText,
        }),
      { initialProps: { elapsedMs: toElapsedMs(lateFrame), handoffElapsedMs: 0 } },
    );

    const initialText = result.current.centerGlyphs.map((glyph) => glyph.char).join('');

    expect(visibleCursorElapsedMs).toBeDefined();

    rerender({ elapsedMs: toElapsedMs(lateFrame), handoffElapsedMs: visibleCursorElapsedMs ?? deleteStepMs + 1 });

    const shortenedText = result.current.centerGlyphs.map((glyph) => glyph.char).join('');
    const expectedVisibleText = finalWords.slice(0, -1).join(' ');

    expect(initialText).toContain('|');
    expect(shortenedText).toBe(`${expectedVisibleText}|`);
    expect(result.current.centerGlyphs.some((glyph) => glyph.tone === 'mixing')).toBe(true);
  });

  it('hides source word glyphs only after their queue item starts', () => {
    const beforeStartElapsed = toElapsedMs(firstItem.startFrame - 1);
    const atStartElapsed = toElapsedMs(firstItem.startFrame);
    const { result, rerender } = renderHook<ReturnType<typeof useStepwiseMerge>, HookProps>(
      ({ elapsedMs }) =>
        useStepwiseMerge({
          elapsedMs,
          handoffElapsedMs: 0,
          phase: 'mixing',
          sourceText,
          styleReferenceText,
        }),
      { initialProps: { elapsedMs: beforeStartElapsed } },
    );

    const hiddenCountBefore = result.current.sourceGlyphs1.filter((glyph) => glyph.hidden).length;

    rerender({ elapsedMs: atStartElapsed });

    const hiddenCountAfter = result.current.sourceGlyphs1.filter((glyph) => glyph.hidden).length;

    expect(hiddenCountBefore).toBe(0);
    expect(hiddenCountAfter).toBe((firstItem.text1Range?.end ?? 0) - (firstItem.text1Range?.start ?? 0));
  });
});
