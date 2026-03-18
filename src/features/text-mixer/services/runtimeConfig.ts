const DEFAULT_PROXY_URL = 'http://localhost:8787';

export function getProxyBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_PROXY_URL?.trim();

  if (!configuredUrl) {
    return DEFAULT_PROXY_URL;
  }

  return configuredUrl.replace(/\/+$/, '');
}
