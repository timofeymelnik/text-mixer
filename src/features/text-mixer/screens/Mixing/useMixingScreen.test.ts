import { MIXING_ANIMATION_TIMINGS, MIXING_MIN_HANDOFF_START_MS } from '../../model/mixingAnimation';
import { getMixingAnimationPhase, getMixingHandoffStartMs } from './useMixingScreen';

describe('getMixingAnimationPhase', () => {
  it('starts with stacked cards while loading has just begun', () => {
    expect(getMixingAnimationPhase('loading', 0)).toBe('stacked');
  });

  it('moves into converging before the mix starts spinning', () => {
    expect(getMixingAnimationPhase('loading', MIXING_ANIMATION_TIMINGS.stackedPhaseMs + 1)).toBe('converging');
  });

  it('shows the mix button before orbital motion starts', () => {
    expect(getMixingAnimationPhase('loading', MIXING_ANIMATION_TIMINGS.convergingPhaseMs + 1)).toBe('armed');
  });

  it('switches to mixing after the intro sequence completes', () => {
    expect(getMixingAnimationPhase('loading', MIXING_ANIMATION_TIMINGS.armedPhaseMs + 1)).toBe('mixing');
  });

  it('keeps success in mixing until the minimum mix window has played', () => {
    expect(getMixingAnimationPhase('success', MIXING_MIN_HANDOFF_START_MS - 1)).toBe('mixing');
  });

  it('uses handoff only after the success beat is ready', () => {
    expect(getMixingAnimationPhase('success', MIXING_MIN_HANDOFF_START_MS)).toBe('handoff');
  });

  it('keeps success in mixing when the result arrived after the minimum handoff mark', () => {
    const lateSuccessAtMs = MIXING_MIN_HANDOFF_START_MS + 480;
    const handoffStartMs = getMixingHandoffStartMs('success', lateSuccessAtMs);

    expect(getMixingAnimationPhase('success', handoffStartMs! - 1, handoffStartMs)).toBe('mixing');
    expect(getMixingAnimationPhase('success', lateSuccessAtMs, handoffStartMs)).toBe('handoff');
  });

  it('uses error when the flow fails', () => {
    expect(getMixingAnimationPhase('error', 300)).toBe('error');
  });
});
