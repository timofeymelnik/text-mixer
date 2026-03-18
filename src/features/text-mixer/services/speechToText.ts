import type { SpeechToTextResponse } from '../types';
import { requestJson } from './httpClient';
import { RemoteServiceError } from './serviceErrors';

type SpeechToTextRequest = {
  mimeType?: string;
  uri: string;
};

export async function speechToText({ mimeType = 'audio/m4a', uri }: SpeechToTextRequest): Promise<SpeechToTextResponse> {
  const formData = new FormData();
  const fileName = uri.split('/').pop() ?? 'recording.m4a';

  formData.append('audio', {
    uri,
    name: fileName,
    type: mimeType,
  } as never);

  try {
    console.info('[speech-to-text] uploading audio', {
      fileName,
      mimeType,
      uri,
    });

    const response = await requestJson<SpeechToTextResponse>('/api/speech-to-text', {
      method: 'POST',
      body: formData,
      timeoutMs: 30000,
    });

    if (!response.text?.trim()) {
      throw new RemoteServiceError('invalid_response', 'Speech-to-text returned an empty transcript.');
    }

    const text = response.text.trim();

    console.info('[speech-to-text] transcript received', {
      length: text.length,
    });

    return {
      text,
    };
  } catch (error) {
    console.error('[speech-to-text] request failed', error);
    throw error;
  }
}
