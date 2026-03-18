import { isValidInput, normalizeInput, toPreview } from './validation';

describe('validation', () => {
  it('normalizes whitespace', () => {
    expect(normalizeInput('  hello   world  ')).toBe('hello world');
  });

  it('rejects empty and whitespace-only values', () => {
    expect(isValidInput('')).toBe(false);
    expect(isValidInput('   \n\t')).toBe(false);
  });

  it('creates compact preview', () => {
    expect(toPreview('A quick brown fox', 10)).toBe('A quick b…');
  });
});
