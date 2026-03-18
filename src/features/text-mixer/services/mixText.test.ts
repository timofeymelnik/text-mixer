import { mixText } from './mixText';
import type { MixRequest } from '../types';

const request: MixRequest = {
  sourceText: 'Sunrise over a quiet city',
  styleReferenceText: 'Write in a dramatic cinematic style',
  mode: 'style-transfer',
};

describe('mixText', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    process.env.EXPO_PUBLIC_PROXY_URL = 'http://localhost:8787';
  });

  it('returns output for a successful proxy response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output: 'Rewritten output',
        mode: 'style-transfer',
        meta: {
          provider: 'claude',
        },
      }),
    } as Response);

    const result = await mixText(request);

    expect(result.mode).toBe('style-transfer');
    expect(result.output).toBe('Rewritten output');
    expect(result.meta?.provider).toBe('claude');
  });

  it('throws typed timeout error', async () => {
    const abortError = new Error('Timed out');
    abortError.name = 'AbortError';

    jest.spyOn(global, 'fetch').mockRejectedValue(abortError);

    await expect(mixText(request, { timeoutMs: 10 })).rejects.toEqual(
      expect.objectContaining({
        type: 'timeout',
      }),
    );
  });

  it('throws when the proxy returns an empty result', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        output: '   ',
        mode: 'style-transfer',
      }),
    } as Response);

    await expect(mixText(request)).rejects.toEqual(
      expect.objectContaining({
        type: 'invalid_response',
      }),
    );
  });
});
