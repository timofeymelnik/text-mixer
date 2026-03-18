import cors from 'cors';
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
  },
});

const PORT = Number(process.env.PORT ?? 8787);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_TTS_MODEL_ID = process.env.ELEVENLABS_TTS_MODEL_ID ?? 'eleven_multilingual_v2';
const ELEVENLABS_STT_MODEL_ID = process.env.ELEVENLABS_STT_MODEL_ID ?? 'scribe_v1';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

function createRequestId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function logInfo(scope, message, meta = undefined) {
  if (meta === undefined) {
    console.info(`[${scope}] ${message}`);
    return;
  }

  console.info(`[${scope}] ${message}`, meta);
}

function logError(scope, message, error, meta = undefined) {
  if (meta === undefined) {
    console.error(`[${scope}] ${message}`, error);
    return;
  }

  console.error(`[${scope}] ${message}`, meta, error);
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_request, response) => {
  response.json({ ok: true });
});

app.post('/api/mix', async (request, response) => {
  if (!ANTHROPIC_API_KEY) {
    response.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured.' });
    return;
  }

  const { sourceText, styleReferenceText, mode } = request.body ?? {};

  if (mode !== 'style-transfer' || !sourceText?.trim() || !styleReferenceText?.trim()) {
    response.status(400).json({ error: 'Source text, style reference text, and mode are required.' });
    return;
  }

  const startedAt = Date.now();

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 900,
        system:
          'You rewrite text with taste and restraint. Preserve the meaning of the source text while adopting the tone, rhythm, and stylistic qualities of the style reference. Return only the rewritten text.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: [
                  'Rewrite the source text using the style, tone, rhythm, and emotional flavor of the style reference.',
                  'Preserve the core meaning of the source text.',
                  'Return only the rewritten result, concise (1-3 paragraphs).',
                  `Source text: ${sourceText}`,
                  `Style reference: ${styleReferenceText}`,
                ].join('\n'),
              },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorBody = await anthropicResponse.text();
      response.status(502).json({ error: `Claude request failed: ${errorBody}` });
      return;
    }

    const data = await anthropicResponse.json();
    const output = Array.isArray(data.content)
      ? data.content
          .filter((item) => item.type === 'text' && typeof item.text === 'string')
          .map((item) => item.text)
          .join('\n')
          .trim()
      : '';

    if (!output) {
      response.status(502).json({ error: 'Claude returned an empty response.' });
      return;
    }

    response.json({
      output,
      mode,
      meta: {
        durationMs: Date.now() - startedAt,
        provider: 'claude',
      },
    });
  } catch (error) {
    response.status(502).json({ error: error instanceof Error ? error.message : 'Failed to contact Claude.' });
  }
});

app.post('/api/speech-to-text', upload.single('audio'), async (request, response) => {
  const requestId = createRequestId('stt');

  if (!ELEVENLABS_API_KEY) {
    logInfo('speech-to-text', 'missing ElevenLabs API key', { requestId });
    response.status(500).json({ error: 'ELEVENLABS_API_KEY is not configured.' });
    return;
  }

  if (!request.file) {
    logInfo('speech-to-text', 'request missing audio file', { requestId });
    response.status(400).json({ error: 'Audio file is required.' });
    return;
  }

  try {
    const startedAt = Date.now();
    logInfo('speech-to-text', 'received audio upload', {
      requestId,
      mimeType: request.file.mimetype,
      modelId: ELEVENLABS_STT_MODEL_ID,
      originalName: request.file.originalname,
      size: request.file.size,
    });

    const formData = new FormData();
    const blob = new Blob([request.file.buffer], {
      type: request.file.mimetype || 'audio/m4a',
    });

    formData.append('file', blob, request.file.originalname || 'recording.m4a');
    formData.append('model_id', ELEVENLABS_STT_MODEL_ID);

    const elevenResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    });

    if (!elevenResponse.ok) {
      const errorBody = await elevenResponse.text();
      logInfo('speech-to-text', 'ElevenLabs returned an error', {
        requestId,
        responseBody: errorBody,
        status: elevenResponse.status,
        statusText: elevenResponse.statusText,
      });
      response.status(502).json({ error: `ElevenLabs STT failed: ${errorBody}` });
      return;
    }

    const data = await elevenResponse.json();
    const text = typeof data.text === 'string' ? data.text.trim() : '';

    if (!text) {
      logInfo('speech-to-text', 'ElevenLabs returned an empty transcript', { requestId });
      response.status(502).json({ error: 'ElevenLabs returned an empty transcript.' });
      return;
    }

    logInfo('speech-to-text', 'transcription completed', {
      durationMs: Date.now() - startedAt,
      requestId,
      transcriptLength: text.length,
    });
    response.json({ text });
  } catch (error) {
    logError('speech-to-text', 'transcription request failed', error, { requestId });
    response.status(502).json({ error: error instanceof Error ? error.message : 'Failed to transcribe audio.' });
  }
});

app.post('/api/text-to-speech', async (request, response) => {
  const requestId = createRequestId('tts');

  if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
    logInfo('text-to-speech', 'missing ElevenLabs configuration', {
      hasApiKey: Boolean(ELEVENLABS_API_KEY),
      hasVoiceId: Boolean(ELEVENLABS_VOICE_ID),
      requestId,
    });
    response.status(500).json({ error: 'ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be configured.' });
    return;
  }

  const text = typeof request.body?.text === 'string' ? request.body.text.trim() : '';

  if (!text) {
    logInfo('text-to-speech', 'request missing text', { requestId });
    response.status(400).json({ error: 'Text is required.' });
    return;
  }

  try {
    const startedAt = Date.now();
    logInfo('text-to-speech', 'sending synthesis request', {
      modelId: ELEVENLABS_TTS_MODEL_ID,
      requestId,
      textLength: text.length,
      voiceId: ELEVENLABS_VOICE_ID,
    });

    const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_TTS_MODEL_ID,
      }),
    });

    if (!elevenResponse.ok) {
      const errorBody = await elevenResponse.text();
      logInfo('text-to-speech', 'ElevenLabs returned an error', {
        requestId,
        responseBody: errorBody,
        status: elevenResponse.status,
        statusText: elevenResponse.statusText,
      });
      response.status(502).json({ error: `ElevenLabs TTS failed: ${errorBody}` });
      return;
    }

    const audioBuffer = Buffer.from(await elevenResponse.arrayBuffer());

    logInfo('text-to-speech', 'synthesis completed', {
      audioBytes: audioBuffer.length,
      durationMs: Date.now() - startedAt,
      requestId,
    });

    response.json({
      audioBase64: audioBuffer.toString('base64'),
      mimeType: 'audio/mpeg',
    });
  } catch (error) {
    logError('text-to-speech', 'synthesis request failed', error, { requestId });
    response.status(502).json({ error: error instanceof Error ? error.message : 'Failed to synthesize audio.' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT}`);
});
