import { act, renderHook, waitFor } from '@testing-library/react-native';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

import { speechToText } from '../services';
import { useVoiceCapture } from './useVoiceCapture';

jest.mock('../services', () => ({
  speechToText: jest.fn(),
}));

const expoAudioMock = jest.requireMock('expo-audio') as {
  __mockRecorder: { uri: string | null };
  __mockRecorderState: { durationMillis: number; isRecording: boolean };
};

describe('useVoiceCapture', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    expoAudioMock.__mockRecorder.uri = null;
    expoAudioMock.__mockRecorderState.durationMillis = 0;
    expoAudioMock.__mockRecorderState.isRecording = false;
    (getRecordingPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      status: 'granted',
    });
    (requestRecordingPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: true,
      status: 'granted',
    });
  });

  it('moves from recording to transcribing to idle and inserts the transcript', async () => {
    let resolveTranscript: ((value: { text: string }) => void) | null = null;
    const onTranscribed = jest.fn();

    (speechToText as jest.Mock).mockImplementation(
      () =>
        new Promise<{ text: string }>((resolve) => {
          resolveTranscript = resolve;
        }),
    );

    const { result } = renderHook(() => useVoiceCapture({ onTranscribed }));

    await act(async () => {
      await result.current.onPress();
    });

    expect(result.current.recordingState).toBe('recording');

    act(() => {
      expoAudioMock.__mockRecorder.uri = 'file://voice.m4a';
      expoAudioMock.__mockRecorderState.isRecording = false;
    });

    let stopPromise: Promise<void> | null = null;

    act(() => {
      stopPromise = result.current.onPress();
    });

    await waitFor(() => {
      expect(result.current.recordingState).toBe('transcribing');
    });

    await act(async () => {
      resolveTranscript?.({ text: 'Transcript text' });
      await stopPromise;
    });

    expect(onTranscribed).toHaveBeenCalledWith('Transcript text');
    expect(result.current.recordingState).toBe('idle');
  });

  it('surfaces a permission error when microphone access is denied', async () => {
    (getRecordingPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: false,
      status: 'denied',
    });
    (requestRecordingPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: false,
      status: 'denied',
    });

    const { result } = renderHook(() =>
      useVoiceCapture({
        onTranscribed: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.onPress();
    });

    expect(result.current.recordingState).toBe('error');
    expect(result.current.errorMessage).toContain('Microphone access');
  });

  it('surfaces the proxy transcription error message', async () => {
    (speechToText as jest.Mock).mockRejectedValue(new Error('ElevenLabs STT failed: unsupported audio format.'));

    const { result } = renderHook(() =>
      useVoiceCapture({
        onTranscribed: jest.fn(),
      }),
    );

    await act(async () => {
      await result.current.onPress();
    });

    act(() => {
      expoAudioMock.__mockRecorder.uri = 'file://voice.m4a';
      expoAudioMock.__mockRecorderState.isRecording = false;
    });

    await act(async () => {
      await result.current.onPress();
    });

    expect(result.current.recordingState).toBe('error');
    expect(result.current.errorMessage).toContain('unsupported audio format');
  });
});
