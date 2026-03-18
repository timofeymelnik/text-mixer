import { speechToText } from './speechToText';

describe('speechToText', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    process.env.EXPO_PUBLIC_PROXY_URL = 'http://localhost:8787';
  });

  it('returns the trimmed transcript on success', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        text: '  transcript from voice  ',
      }),
    } as Response);

    await expect(speechToText({ uri: 'file://voice.m4a' })).resolves.toEqual({
      text: 'transcript from voice',
    });
  });

  it('throws when the transcript is empty', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        text: '   ',
      }),
    } as Response);

    await expect(speechToText({ uri: 'file://voice.m4a' })).rejects.toEqual(
      expect.objectContaining({
        type: 'invalid_response',
      }),
    );
  });

  it('throws on upload failure', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(speechToText({ uri: 'file://voice.m4a' })).rejects.toEqual(
      expect.objectContaining({
        type: 'network',
      }),
    );
  });
});
