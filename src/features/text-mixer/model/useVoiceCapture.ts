import { useCallback, useEffect, useState } from 'react';
import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import type { RecordingState } from '../types';
import { speechToText } from '../services';

type UseVoiceCaptureOptions = {
  onTranscribed: (text: string) => void;
};

function toMimeType(uri: string) {
  if (uri.endsWith('.webm')) {
    return 'audio/webm';
  }

  if (uri.endsWith('.wav')) {
    return 'audio/wav';
  }

  return 'audio/m4a';
}

function toVoiceCaptureErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Voice transcription failed. You can keep typing instead.';
}

export function useVoiceCapture({ onTranscribed }: UseVoiceCaptureOptions) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 150);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    }).catch(() => undefined);
  }, []);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setRecordingState((current) => (current === 'error' ? 'idle' : current));
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);

    const currentPermission = await getRecordingPermissionsAsync();
    const nextPermission = currentPermission.granted ? currentPermission : await requestRecordingPermissionsAsync();

    if (!nextPermission.granted) {
      console.warn('[voice-capture] microphone permission denied');
      setRecordingState('error');
      setErrorMessage('Microphone access is required for voice input.');
      return;
    }

    try {
      console.info('[voice-capture] starting recording');
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordingState('recording');
    } catch (error) {
      console.error('[voice-capture] failed to start recording', error);
      setRecordingState('error');
      setErrorMessage('Unable to start recording on this device.');
    }
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    try {
      setRecordingState('transcribing');
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const uri = recorder.uri;

      if (!uri) {
        throw new Error('Missing recording URI.');
      }

      console.info('[voice-capture] recording stopped, sending to transcription', {
        mimeType: toMimeType(uri),
        uri,
      });

      const response = await speechToText({
        uri,
        mimeType: toMimeType(uri),
      });

      console.info('[voice-capture] transcription completed', {
        length: response.text.length,
      });
      onTranscribed(response.text);
      setErrorMessage(null);
      setRecordingState('idle');
    } catch (error) {
      console.error('[voice-capture] transcription failed', error);
      setRecordingState('error');
      setErrorMessage(toVoiceCaptureErrorMessage(error));
    }
  }, [onTranscribed, recorder]);

  const onPress = useCallback(async () => {
    if (recordingState === 'transcribing') {
      return;
    }

    if (recordingState === 'recording') {
      await stopRecording();
      return;
    }

    await startRecording();
  }, [recordingState, startRecording, stopRecording]);

  return {
    clearError,
    durationMs: recorderState.durationMillis ?? 0,
    errorMessage,
    isBusy: recordingState === 'recording' || recordingState === 'transcribing',
    onPress,
    recordingState,
  };
}
