import { useCallback, useEffect, useRef, useState } from 'react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import type { PlaybackState } from '../types';
import { textToSpeech } from '../services';

type UseResultAudioOptions = {
  text: string;
};

type CachedAudio = {
  text: string;
  uri: string;
};

function toAudioUri(audioUrl?: string, audioBase64?: string, mimeType?: string) {
  if (audioUrl) {
    return audioUrl;
  }

  if (!audioBase64) {
    return null;
  }

  return `data:${mimeType ?? 'audio/mpeg'};base64,${audioBase64}`;
}

function toResultAudioErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Audio playback is unavailable right now.';
}

export function useResultAudio({ text }: UseResultAudioOptions) {
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);
  const cachedAudioRef = useRef<CachedAudio | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (playbackState === 'playing' && playerStatus.didJustFinish) {
      setPlaybackState('idle');
    }
  }, [playbackState, playerStatus.didJustFinish]);

  useEffect(() => {
    cachedAudioRef.current = null;
  }, [text]);

  const onListen = useCallback(async () => {
    if (!text.trim()) {
      return;
    }

    if (playbackState === 'playing') {
      player.pause();
      await player.seekTo(0).catch(() => undefined);
      setPlaybackState('idle');
      return;
    }

    setErrorMessage(null);

    try {
      let sourceUri = cachedAudioRef.current?.text === text ? cachedAudioRef.current.uri : null;

      if (!sourceUri) {
        setPlaybackState('synthesizing');
        console.info('[result-audio] synthesizing playback audio');

        const response = await textToSpeech(text);

        sourceUri = toAudioUri(response.audioUrl, response.audioBase64, response.mimeType);

        if (!sourceUri) {
          throw new Error('Missing audio source.');
        }

        cachedAudioRef.current = {
          text,
          uri: sourceUri,
        };
      }

      console.info('[result-audio] starting playback', {
        sourceType: sourceUri.startsWith('data:') ? 'base64' : 'url',
      });
      player.replace({ uri: sourceUri });
      player.play();
      setPlaybackState('playing');
    } catch (error) {
      console.error('[result-audio] playback failed', error);
      setPlaybackState('error');
      setErrorMessage(toResultAudioErrorMessage(error));
    }
  }, [playbackState, player, text]);

  return {
    errorMessage,
    isBusy: playbackState === 'synthesizing',
    isPlaying: playbackState === 'playing',
    onListen,
    playbackState,
  };
}
