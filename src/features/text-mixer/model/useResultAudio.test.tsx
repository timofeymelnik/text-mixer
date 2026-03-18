import { act, renderHook } from '@testing-library/react-native';

import { textToSpeech } from '../services';
import { useResultAudio } from './useResultAudio';

jest.mock('../services', () => ({
  textToSpeech: jest.fn(),
}));

const expoAudioMock = jest.requireMock('expo-audio') as {
  __mockPlayer: { play: jest.Mock; replace: jest.Mock };
  __mockPlayerStatus: { didJustFinish: boolean; isPlaying: boolean };
};

describe('useResultAudio', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    expoAudioMock.__mockPlayerStatus.didJustFinish = false;
    expoAudioMock.__mockPlayerStatus.isPlaying = false;
  });

  it('moves from synthesizing to playing to idle', async () => {
    let resolveAudio: ((value: { audioBase64: string; mimeType: string }) => void) | null = null;

    (textToSpeech as jest.Mock).mockImplementation(
      () =>
        new Promise<{ audioBase64: string; mimeType: string }>((resolve) => {
          resolveAudio = resolve;
        }),
    );

    const { result, rerender } = renderHook<ReturnType<typeof useResultAudio>, { text: string }>(
      ({ text }) =>
        useResultAudio({
          text,
        }),
      {
        initialProps: {
          text: 'Generated output',
        },
      },
    );

    let playPromise: Promise<void> | null = null;

    act(() => {
      playPromise = result.current.onListen();
    });

    expect(result.current.playbackState).toBe('synthesizing');

    await act(async () => {
      resolveAudio?.({
        audioBase64: 'ZmFrZQ==',
        mimeType: 'audio/mpeg',
      });
      await playPromise;
    });

    expect(expoAudioMock.__mockPlayer.replace).toHaveBeenCalled();
    expect(expoAudioMock.__mockPlayer.play).toHaveBeenCalled();
    expect(result.current.playbackState).toBe('playing');

    act(() => {
      expoAudioMock.__mockPlayerStatus.didJustFinish = true;
    });

    rerender({ text: 'Generated output' });

    expect(result.current.playbackState).toBe('idle');
  });

  it('surfaces a synthesis failure', async () => {
    (textToSpeech as jest.Mock).mockRejectedValue(new Error('tts failed'));

    const { result } = renderHook(() =>
      useResultAudio({
        text: 'Generated output',
      }),
    );

    await act(async () => {
      await result.current.onListen();
    });

    expect(result.current.playbackState).toBe('error');
    expect(result.current.errorMessage).toContain('tts failed');
  });
});
