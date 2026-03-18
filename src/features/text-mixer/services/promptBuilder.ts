import type { MixRequest } from '../types';

export function buildStyleTransferPrompt(request: MixRequest): string {
  return [
    'Rewrite the source text using the style, tone, rhythm, and emotional flavor of the style reference.',
    'Preserve the core meaning of the source text.',
    'Return only the rewritten result, concise (1-3 paragraphs).',
    `Source text: ${request.sourceText}`,
    `Style reference: ${request.styleReferenceText}`,
  ].join('\n');
}
