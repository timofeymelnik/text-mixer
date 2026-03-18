import { scaleAnimationMs } from './animationSpeed';

export const MIXING_ANIMATION_TIMINGS = {
  stackedPhaseMs: scaleAnimationMs(380),
  convergingPhaseMs: scaleAnimationMs(980),
  armedPhaseMs: scaleAnimationMs(1360),
  minimumMixingPhaseMs: scaleAnimationMs(4400),
  handoffDurationMs: scaleAnimationMs(680),
  frameMs: 20,
  logicalFrameMs: 40,
} as const;

export const MIXING_MIN_HANDOFF_START_MS =
  MIXING_ANIMATION_TIMINGS.armedPhaseMs + MIXING_ANIMATION_TIMINGS.minimumMixingPhaseMs;
