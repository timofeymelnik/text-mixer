import { RemoteServiceError } from './serviceErrors';
import { getProxyBaseUrl } from './runtimeConfig';

type JsonRequestOptions = {
  body?: BodyInit | null;
  headers?: HeadersInit;
  method?: 'GET' | 'POST';
  timeoutMs?: number;
};

async function readErrorMessage(response: Response) {
  try {
    const data = await response.json();

    if (typeof data?.error === 'string') {
      return data.error;
    }
  } catch {
    // Ignore malformed error payloads and fall back to a generic message.
  }

  return `Request failed with status ${response.status}.`;
}

export async function requestJson<T>(path: string, options: JsonRequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${getProxyBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers: options.headers,
      body: options.body,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new RemoteServiceError('network', await readErrorMessage(response));
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof RemoteServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new RemoteServiceError('timeout', 'The request took too long. Please try again.');
    }

    throw new RemoteServiceError('network', 'Unable to reach the proxy server.');
  } finally {
    clearTimeout(timeoutId);
  }
}
