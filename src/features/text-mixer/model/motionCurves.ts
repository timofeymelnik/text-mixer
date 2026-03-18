import { Easing } from 'react-native-reanimated';

function createCurve(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  fallback: (value: number) => number,
) {
  return typeof Easing.bezier === 'function' ? Easing.bezier(x1, y1, x2, y2) : fallback;
}

export const MOTION_CURVES = {
  gentleIn: createCurve(0.32, 0, 0.67, 0, Easing.in(Easing.cubic)),
  gentleInOut: createCurve(0.65, 0, 0.35, 1, Easing.inOut(Easing.cubic)),
  gentleOut: createCurve(0.22, 1, 0.36, 1, Easing.out(Easing.cubic)),
} as const;
