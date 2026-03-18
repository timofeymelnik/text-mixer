import type { OrbitalMergePhase } from './OrbitalMerge.types';
import { scaleAnimationMs } from '../../model/animationSpeed';
import { MIXING_ANIMATION_TIMINGS } from '../../model/mixingAnimation';

export type SourceGlyph = {
  char: string;
  hidden: boolean;
};

export type CenterGlyph = {
  char: string;
  colorToken: '$black' | '$textLight400' | '$textLight500' | '$textLight700' | '$textLight900';
  opacity: number;
  tone: 'resolved' | 'mixing';
};

export type TransferItem = {
  text1Range: WordRange | null;
  text2Range: WordRange | null;
  word: string;
};

export type StepwiseQueueItem = {
  text1Range: WordRange | null;
  text2Range: WordRange | null;
  word: string;
  startFrame: number;
  endFrame: number;
};

export type WordRange = {
  start: number;
  end: number;
  word: string;
};

export const STEPWISE_MERGE_TIMINGS = {
  borderFadeMs: scaleAnimationMs(500),
  queueStartMs: MIXING_ANIMATION_TIMINGS.armedPhaseMs,
  frameMs: MIXING_ANIMATION_TIMINGS.logicalFrameMs,
  initialDelayFrames: 5,
  staggerFrames: 3,
  startJitterFrames: 2,
  durationBaseFrames: 14,
  durationVarianceFrames: 8,
  dudHoldFrames: 3,
  settleFrames: 0,
  idleScrambleChance: 0.24,
  handoffCursorBlinkMs: scaleAnimationMs(120),
} as const;

const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*?#________';
const MIXING_GRAY_TOKENS = ['$textLight400', '$textLight500', '$textLight700', '$textLight900'] as const;
const HANDOFF_MIN_WORD_DELETE_STEP_MS = scaleAnimationMs(50);
const HANDOFF_MAX_WORD_DELETE_STEP_MS = scaleAnimationMs(160);

const OPACITY_FLOOR = 0.24;
const SCRAMBLE_OPACITY_PIVOT = 0.55;
const SCRAMBLE_OPACITY_START = 0.74;
const SCRAMBLE_OPACITY_PEAK = 0.66;
const SCRAMBLE_OPACITY_DECAY = 0.48;
const SCRAMBLE_OPACITY_VARIANCE = 0.16;
const SETTLING_OPACITY_BASE = 0.5;
const SETTLING_OPACITY_SCALE = 0.42;
const SETTLING_OPACITY_VARIANCE = 0.08;
const SETTLING_TONE_THRESHOLD = 0.82;
const CURSOR_FADE_THRESHOLD = 0.82;
const REVEAL_THRESHOLD = 0.52;
const REVEAL_RANGE = 0.48;
const CURSOR_OPACITY = 0.78;
const SHIMMER_OPACITY_BASE = 0.46;
const SHIMMER_OPACITY_VARIANCE = 0.24;

function clampOpacity(value: number) {
  return Math.max(OPACITY_FLOOR, Math.min(1, Math.round(value * 100) / 100));
}

function getMixingGrayToken(seed: number): CenterGlyph['colorToken'] {
  const toneIndex = Math.floor(pseudoRandom(seed) * MIXING_GRAY_TOKENS.length);

  return MIXING_GRAY_TOKENS[toneIndex] ?? '$textLight500';
}

function getSettlingToken(progress: number, seed: number): CenterGlyph['colorToken'] {
  if (progress >= SETTLING_TONE_THRESHOLD) {
    return '$textLight900';
  }

  return pseudoRandom(seed) > 0.5 ? '$textLight900' : '$textLight700';
}

function getScrambleOpacity(progress: number, seed: number) {
  const baseOpacity =
    progress < SCRAMBLE_OPACITY_PIVOT
      ? SCRAMBLE_OPACITY_START
      : SCRAMBLE_OPACITY_PEAK - Math.max(0, progress - SCRAMBLE_OPACITY_PIVOT) * SCRAMBLE_OPACITY_DECAY;
  const variance = (pseudoRandom(seed) - 0.5) * SCRAMBLE_OPACITY_VARIANCE;

  return clampOpacity(baseOpacity + variance);
}

function getSettlingOpacity(progress: number, seed: number) {
  const baseOpacity = SETTLING_OPACITY_BASE + progress * SETTLING_OPACITY_SCALE;
  const variance = (pseudoRandom(seed) - 0.5) * SETTLING_OPACITY_VARIANCE;

  return clampOpacity(baseOpacity + variance);
}

function createResolvedGlyph(char: string): CenterGlyph {
  return {
    char,
    colorToken: '$black',
    opacity: 1,
    tone: 'resolved',
  };
}

function createMixingGlyph(
  char: string,
  colorToken: CenterGlyph['colorToken'],
  opacity: number,
): CenterGlyph {
  return {
    char,
    colorToken,
    opacity,
    tone: 'mixing',
  };
}

function getVisibleHandoffWordCount(wordCount: number, handoffElapsedMs: number) {
  const deleteStepMs = getHandoffWordDeleteStepMs(wordCount);
  const deletedWordCount = Math.floor(handoffElapsedMs / deleteStepMs);

  return Math.max(0, wordCount - deletedWordCount);
}

function shouldShowHandoffCursor(visibleWordCount: number, handoffElapsedMs: number) {
  const isCursorVisible = Math.floor(handoffElapsedMs / STEPWISE_MERGE_TIMINGS.handoffCursorBlinkMs) % 2 === 0;
  const isBeforeCursorFade = handoffElapsedMs < MIXING_ANIMATION_TIMINGS.handoffDurationMs * CURSOR_FADE_THRESHOLD;

  return isCursorVisible && (visibleWordCount > 0 || isBeforeCursorFade);
}

function renderHandoffGlyphs(words: string[], handoffElapsedMs: number): CenterGlyph[] {
  if (words.length === 0) {
    return [];
  }

  const visibleWordCount = getVisibleHandoffWordCount(words.length, handoffElapsedMs);
  const glyphs = words
    .slice(0, visibleWordCount)
    .join(' ')
    .split('')
    .map((char) => createResolvedGlyph(char));

  if (shouldShowHandoffCursor(visibleWordCount, handoffElapsedMs)) {
    glyphs.push(createMixingGlyph('|', '$textLight700', CURSOR_OPACITY));
  }

  return glyphs;
}

function getIdleWindowState(queue: StepwiseQueueItem[], visibleItems: StepwiseQueueItem[], frame: number, phase: OrbitalMergePhase) {
  const maxEndFrame = queue.reduce((maxFrame, item) => Math.max(maxFrame, item.endFrame), -1);
  const hasIdleWindow = phase === 'mixing' && frame >= maxEndFrame + STEPWISE_MERGE_TIMINGS.settleFrames;
  const idleFrame = hasIdleWindow
    ? Math.floor((frame - maxEndFrame - STEPWISE_MERGE_TIMINGS.settleFrames) / STEPWISE_MERGE_TIMINGS.dudHoldFrames)
    : -1;
  const visibleCharCount = visibleItems.reduce((count, item) => count + item.word.length, 0);

  return {
    forcedIdleIndex: hasIdleWindow && visibleCharCount > 0 ? idleFrame % visibleCharCount : -1,
    hasIdleWindow,
    idleFrame,
  };
}

function createIdleShimmerGlyph(currentVisibleCharIndex: number, glyphIndex: number, idleFrame: number): CenterGlyph {
  const shimmerSeed = (glyphIndex + 1) * 43 + idleFrame * 11;

  return createMixingGlyph(
    getIndexedScrambleChar(currentVisibleCharIndex, idleFrame),
    getMixingGrayToken(shimmerSeed),
    clampOpacity(SHIMMER_OPACITY_BASE + pseudoRandom(shimmerSeed + 5) * SHIMMER_OPACITY_VARIANCE),
  );
}

function maybeCreateResolvedGlyph(
  char: string,
  currentVisibleCharIndex: number,
  forcedIdleIndex: number,
  glyphIndex: number,
  hasIdleWindow: boolean,
  idleFrame: number,
  phase: OrbitalMergePhase,
) {
  if (phase !== 'mixing' || !hasIdleWindow) {
    return createResolvedGlyph(char);
  }

  const shimmerSeed = (glyphIndex + 1) * 43 + idleFrame * 11;
  const shouldKeepShimmering =
    currentVisibleCharIndex === forcedIdleIndex ||
    pseudoRandom(shimmerSeed) < STEPWISE_MERGE_TIMINGS.idleScrambleChance;

  if (shouldKeepShimmering) {
    return createIdleShimmerGlyph(currentVisibleCharIndex, glyphIndex, idleFrame);
  }

  return createResolvedGlyph(char);
}

function createTransitionGlyph(
  char: string,
  currentVisibleCharIndex: number,
  dudFrame: number,
  itemIndex: number,
  localFrame: number,
  item: StepwiseQueueItem,
) {
  const durationFrames = Math.max(1, item.endFrame - item.startFrame);
  const progress = Math.min(1, localFrame / durationFrames);
  const transitionSeed = (currentVisibleCharIndex + 1) * 83 + (itemIndex + 1) * 29;
  const shouldRevealLetter =
    progress >= REVEAL_THRESHOLD &&
    pseudoRandom(transitionSeed + dudFrame * 7) < (progress - REVEAL_THRESHOLD) / REVEAL_RANGE;

  if (shouldRevealLetter) {
    return {
      char,
      colorToken: getSettlingToken(progress, transitionSeed + 17),
      opacity: getSettlingOpacity(progress, transitionSeed + 3),
      tone: 'resolved' as const,
    };
  }

  return createMixingGlyph(
    getIndexedScrambleChar(currentVisibleCharIndex, dudFrame),
    getMixingGrayToken(transitionSeed + dudFrame * 13),
    getScrambleOpacity(progress, transitionSeed + 11),
  );
}

export function getHandoffWordDeleteStepMs(wordCount: number) {
  const safeWordCount = Math.max(1, wordCount);

  return Math.min(
    HANDOFF_MAX_WORD_DELETE_STEP_MS,
    Math.max(HANDOFF_MIN_WORD_DELETE_STEP_MS, Math.floor(MIXING_ANIMATION_TIMINGS.handoffDurationMs / safeWordCount)),
  );
}

export function clampText(text: string, maxLength = 56) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function getIndexedScrambleChar(index: number, dudFrame: number) {
  const charIndex = Math.floor(pseudoRandom((index + 1) * 97 + dudFrame * 13) * SCRAMBLE_CHARS.length);

  return SCRAMBLE_CHARS[charIndex] ?? '_';
}

function buildWordRanges(text: string): WordRange[] {
  return Array.from(text.matchAll(/\S+/g), (match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    word: match[0],
  }));
}

export function buildTransferSequence(text1: string, text2: string): TransferItem[] {
  const text1Words = buildWordRanges(text1).reverse();
  const text2Words = buildWordRanges(text2).reverse();
  const maxLength = Math.max(text1Words.length, text2Words.length);
  const sequence: TransferItem[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const text1Range = text1Words[index] ?? null;
    const text2Range = text2Words[index] ?? null;
    const candidates = [text1Range?.word, text2Range?.word].filter((word): word is string => Boolean(word));

    if (candidates.length === 0) {
      continue;
    }

    const randomIndex = Math.floor(pseudoRandom((index + 1) * 17) * candidates.length);

    sequence.push({
      text1Range,
      text2Range,
      word: candidates[randomIndex] ?? candidates[0] ?? '',
    });
  }

  return sequence;
}

export function buildScrambleQueue(sequence: TransferItem[]) {
  return sequence.map<StepwiseQueueItem>((item, index) => {
    const startFrame =
      STEPWISE_MERGE_TIMINGS.initialDelayFrames +
      index * STEPWISE_MERGE_TIMINGS.staggerFrames +
      Math.floor(pseudoRandom((index + 1) * 19) * (STEPWISE_MERGE_TIMINGS.startJitterFrames + 1));
    const endFrame =
      startFrame +
      STEPWISE_MERGE_TIMINGS.durationBaseFrames +
      Math.floor(pseudoRandom((index + 1) * 31) * (STEPWISE_MERGE_TIMINGS.durationVarianceFrames + 1));

    return {
      ...item,
      startFrame,
      endFrame,
    };
  });
}

export function getQueueFrame(elapsedMs: number) {
  if (elapsedMs <= STEPWISE_MERGE_TIMINGS.queueStartMs) {
    return -1;
  }

  return Math.floor((elapsedMs - STEPWISE_MERGE_TIMINGS.queueStartMs) / STEPWISE_MERGE_TIMINGS.frameMs);
}

export function buildRemovedIndices(queue: StepwiseQueueItem[], frame: number, source: 'text1' | 'text2') {
  const indices = new Set<number>();

  queue.forEach((item) => {
    const range = source === 'text1' ? item.text1Range : item.text2Range;

    if (range && frame >= item.startFrame) {
      for (let index = range.start; index < range.end; index += 1) {
        indices.add(index);
      }
    }
  });

  return indices;
}

export function toSourceGlyphs(text: string, removedIndices: Set<number>): SourceGlyph[] {
  return text.split('').map((char, index) => ({
    char: removedIndices.has(index) ? ' ' : char,
    hidden: removedIndices.has(index),
  }));
}

export function renderCenterGlyphs(
  queue: StepwiseQueueItem[],
  frame: number,
  phase: OrbitalMergePhase,
  handoffElapsedMs = 0,
): CenterGlyph[] {
  if (phase === 'error') {
    return [];
  }

  if (phase === 'handoff') {
    return renderHandoffGlyphs(queue.map((item) => item.word), handoffElapsedMs);
  }

  const visibleItems = queue.filter((item) => frame >= item.startFrame);

  if (visibleItems.length === 0) {
    return [];
  }

  const { forcedIdleIndex, hasIdleWindow, idleFrame } = getIdleWindowState(queue, visibleItems, frame, phase);
  const glyphs: CenterGlyph[] = [];
  let visibleCharIndex = 0;

  visibleItems.forEach((item, itemIndex) => {
    if (itemIndex > 0) {
      glyphs.push(createResolvedGlyph(' '));
    }

    const isResolved = frame >= item.endFrame;
    const localFrame = Math.max(0, frame - item.startFrame);
    const dudFrame = Math.floor(localFrame / STEPWISE_MERGE_TIMINGS.dudHoldFrames);

    item.word.split('').forEach((char) => {
      const glyphIndex = glyphs.length;
      const currentVisibleCharIndex = visibleCharIndex;
      visibleCharIndex += 1;

      if (isResolved) {
        glyphs.push(
          maybeCreateResolvedGlyph(
            char,
            currentVisibleCharIndex,
            forcedIdleIndex,
            glyphIndex,
            hasIdleWindow,
            idleFrame,
            phase,
          ),
        );
        return;
      }

      glyphs.push(createTransitionGlyph(char, currentVisibleCharIndex, dudFrame, itemIndex, localFrame, item));
    });
  });

  return glyphs;
}
