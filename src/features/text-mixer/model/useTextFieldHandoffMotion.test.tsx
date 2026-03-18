import { renderHook } from '@testing-library/react-native';

import { useTextFieldHandoffMotion } from './useTextFieldHandoffMotion';

describe('useTextFieldHandoffMotion', () => {
  it('exposes the shared motion contract used by both text-entry steps', () => {
    const { result } = renderHook(() =>
      useTextFieldHandoffMotion({
        expandedHeight: 240,
        isRunning: false,
      }),
    );

    expect(result.current.collapsedHeight).toBe(116);
    expect(result.current.actionAnimatedStyle).toBeDefined();
    expect(result.current.contentAnimatedStyle).toBeDefined();
    expect(result.current.fieldContentAnimatedStyle).toBeDefined();
    expect(result.current.fieldAnimatedStyle).toBeDefined();
    expect(result.current.supportingAnimatedStyle).toBeDefined();
  });
});
