import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useResultRevealCard } from './useResultRevealCard';
import { scaleAnimationMs } from '../../model/animationSpeed';

describe('useResultRevealCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts at intro stage and advances through typing to done', async () => {
    const { result } = renderHook(() => useResultRevealCard('Hello world'));

    expect(result.current.stage).toBe('intro');
    expect(result.current.visibleText).toBe('');

    act(() => {
      jest.advanceTimersByTime(scaleAnimationMs(160) + 1);
    });

    expect(result.current.stage).toBe('typing');

    act(() => {
      jest.advanceTimersByTime(scaleAnimationMs(60));
    });

    await waitFor(() => {
      expect(result.current.visibleText.length).toBeGreaterThan(0);
    });

    act(() => {
      jest.advanceTimersByTime(scaleAnimationMs(2000));
    });

    await waitFor(() => {
      expect(result.current.stage).toBe('done');
    });

    expect(result.current.visibleText).toBe('Hello world');
  });

  it('replays the reveal sequence on remount', async () => {
    const firstMount = renderHook(() => useResultRevealCard('World'));

    act(() => {
      jest.advanceTimersByTime(scaleAnimationMs(2000));
    });

    await waitFor(() => {
      expect(firstMount.result.current.stage).toBe('done');
    });

    firstMount.unmount();

    const secondMount = renderHook(() => useResultRevealCard('World'));

    expect(secondMount.result.current.stage).toBe('intro');
    expect(secondMount.result.current.visibleText).toBe('');
  });
});
