export const MAX_TEXT_LENGTH = 1200;

export function normalizeInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function isValidInput(value: string): boolean {
  const normalized = normalizeInput(value);
  return normalized.length > 0 && normalized.length <= MAX_TEXT_LENGTH;
}

export function toPreview(value: string, max = 64): string {
  const normalized = normalizeInput(value);
  if (normalized.length <= max) {
    return normalized;
  }

  return `${normalized.slice(0, max - 1)}…`;
}
