import { textToSpeech } from './textToSpeech';

describe('textToSpeech', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    process.env.EXPO_PUBLIC_PROXY_URL = 'http://localhost:8787';
  });

  it('returns synthesized audio payload on success', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        audioBase64: 'ZmFrZQ==',
        mimeType: 'audio/mpeg',
      }),
    } as Response);

    await expect(textToSpeech('Hello world')).resolves.toEqual({
      audioBase64: 'ZmFrZQ==',
      mimeType: 'audio/mpeg',
    });
  });

  it('throws when synth returns no audio', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    await expect(textToSpeech('Hello world')).rejects.toEqual(
      expect.objectContaining({
        type: 'invalid_response',
      }),
    );
  });

  it('throws on synthesis failure', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(textToSpeech('Hello world')).rejects.toEqual(
      expect.objectContaining({
        type: 'network',
      }),
    );
  });
});
