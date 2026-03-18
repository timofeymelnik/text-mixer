import type { TextToSpeechResponse } from '../types';
import { requestJson } from './httpClient';
import { RemoteServiceError } from './serviceErrors';

export async function textToSpeech(text: string): Promise<TextToSpeechResponse> {
  try {
    console.info('[text-to-speech] requesting audio', {
      textLength: text.length,
    });

    const response = await requestJson<TextToSpeechResponse>('/api/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      timeoutMs: 30000,
    });

    if (!response.audioUrl && !response.audioBase64) {
      throw new RemoteServiceError('invalid_response', 'Text-to-speech did not return playable audio.');
    }

    console.info('[text-to-speech] audio received', {
      hasBase64: Boolean(response.audioBase64),
      hasUrl: Boolean(response.audioUrl),
      mimeType: response.mimeType,
    });

    return response;
  } catch (error) {
    console.error('[text-to-speech] request failed', error);
    throw error;
  }
}
