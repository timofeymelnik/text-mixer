import type { MixErrorType, MixRequest, MixResponse } from '../types';
import { requestJson } from './httpClient';
import { RemoteServiceError } from './serviceErrors';

type MixServiceOptions = {
  timeoutMs?: number;
};

export class MixServiceError extends Error {
  readonly type: MixErrorType;

  constructor(type: MixErrorType, message: string) {
    super(message);
    this.type = type;
  }
}

export async function mixText(
  request: MixRequest,
  options: MixServiceOptions = {},
): Promise<MixResponse> {
  try {
    const response = await requestJson<MixResponse>('/api/mix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      timeoutMs: options.timeoutMs ?? 20000,
    });

    if (!response.output?.trim()) {
      throw new MixServiceError('invalid_response', 'Received an empty result from the AI service.');
    }

    return {
      ...response,
      output: response.output.trim(),
    };
  } catch (error) {
    if (error instanceof MixServiceError) {
      throw error;
    }

    if (error instanceof RemoteServiceError) {
      throw new MixServiceError(error.type, error.message);
    }

    throw new MixServiceError('network', 'Cannot reach the proxy server right now.');
  }
}

export type MixService = (request: MixRequest, options?: MixServiceOptions) => Promise<MixResponse>;
export type { MixServiceOptions };
