import { act, renderHook } from '@testing-library/react-native';

import { useTextStepIntro } from './useTextStepIntro';

describe('useTextStepIntro', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('reveals sections in a staggered sequence on mount', () => {
    const { result } = renderHook(() => useTextStepIntro());

    expect(result.current.visibleSections).toEqual({
      cta: false,
      field: false,
      header: false,
      meta: false,
    });

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.visibleSections).toEqual({
      cta: false,
      field: false,
      header: true,
      meta: false,
    });

    act(() => {
      jest.advanceTimersByTime(180);
    });

    expect(result.current.visibleSections).toEqual({
      cta: false,
      field: true,
      header: true,
      meta: false,
    });

    act(() => {
      jest.advanceTimersByTime(360);
    });

    expect(result.current.visibleSections).toEqual({
      cta: true,
      field: true,
      header: true,
      meta: true,
    });
  });

  it('waits for an explicit start before running the delayed handoff intro', () => {
    const { result } = renderHook(() =>
      useTextStepIntro({
        autoStart: false,
        startDelayMs: 380,
        staggerMs: 90,
      }),
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.visibleSections).toEqual({
      cta: false,
      field: false,
      header: false,
      meta: false,
    });

    act(() => {
      result.current.startIntro();
      jest.advanceTimersByTime(379);
    });

    expect(result.current.visibleSections.header).toBe(false);

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.visibleSections.header).toBe(true);

    act(() => {
      jest.advanceTimersByTime(270);
    });

    expect(result.current.visibleSections).toEqual({
      cta: true,
      field: true,
      header: true,
      meta: true,
    });
  });

  it('does not reschedule the intro after it has already started', () => {
    const { result } = renderHook(() =>
      useTextStepIntro({
        autoStart: false,
      }),
    );

    act(() => {
      result.current.startIntro();
      jest.runAllTimers();
      result.current.startIntro();
    });

    expect(jest.getTimerCount()).toBe(0);
  });
});
