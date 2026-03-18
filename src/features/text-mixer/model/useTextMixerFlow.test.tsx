import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useTextMixerFlow } from './useTextMixerFlow';
import type { MixRequest, MixResponse } from '../types';
import type { MixService } from '../services';

function successResult(output = 'Mixed output'): MixResponse {
  return {
    output,
    mode: 'style-transfer',
    meta: { provider: 'claude', durationMs: 1 },
  };
}

describe('useTextMixerFlow', () => {
  it('validates source text confirmation', () => {
    const { result } = renderHook(() => useTextMixerFlow());

    act(() => {
      result.current.actions.confirmSourceText();
    });

    expect(result.current.state.status).toBe('error');
    expect(result.current.state.error?.type).toBe('validation');
  });

  it('runs loading -> success transition', async () => {
    const mixService: MixService = jest.fn(async (_request: MixRequest) => successResult());
    const { result } = renderHook(() => useTextMixerFlow({ mixService }));

    act(() => {
      result.current.actions.setSourceText('First text');
      result.current.actions.confirmSourceText();
      result.current.actions.setStyleReferenceText('Second text');
    });

    await act(async () => {
      await result.current.actions.startMix();
    });

    expect(result.current.state.status).toBe('success');
    expect(result.current.state.result?.output).toBe('Mixed output');
  });

  it('ignores stale response after reset', async () => {
    let resolveRequest: ((value: MixResponse) => void) | null = null;

    const mixService: MixService = jest.fn(
      () =>
        new Promise<MixResponse>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const { result } = renderHook(() => useTextMixerFlow({ mixService }));

    act(() => {
      result.current.actions.setSourceText('First text');
      result.current.actions.confirmSourceText();
      result.current.actions.setStyleReferenceText('Second text');
    });

    act(() => {
      void result.current.actions.startMix();
      result.current.actions.resetAll();
    });

    act(() => {
      resolveRequest?.(successResult('Late response'));
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.result).toBeNull();
    });
  });
});
