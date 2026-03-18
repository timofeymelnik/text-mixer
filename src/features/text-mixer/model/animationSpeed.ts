export const ANIMATION_SPEED_MULTIPLIER = 2;

export function scaleAnimationMs(value: number) {
  return Math.round(value * ANIMATION_SPEED_MULTIPLIER);
}
