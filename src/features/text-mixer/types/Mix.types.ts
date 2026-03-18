export type MixMode = 'style-transfer';

export type MixStatus = 'idle' | 'loading' | 'success' | 'error';

export type MixErrorType = 'validation' | 'network' | 'timeout' | 'invalid_response';

export type MixRequest = {
  sourceText: string;
  styleReferenceText: string;
  mode: MixMode;
};

export type MixResponse = {
  output: string;
  mode: MixMode;
  meta?: {
    durationMs?: number;
    provider?: 'claude';
  };
};

export type MixError = {
  type: MixErrorType;
  message: string;
};

export type TextMixerState = {
  sourceText: string;
  styleReferenceText: string;
  mode: MixMode;
  status: MixStatus;
  result: MixResponse | null;
  error: MixError | null;
  hasConfirmedSourceText: boolean;
};

export type SpeechToTextResponse = {
  text: string;
};

export type TextToSpeechResponse = {
  audioBase64?: string;
  audioUrl?: string;
  mimeType?: string;
};

export type RecordingState = 'idle' | 'recording' | 'transcribing' | 'error';

export type PlaybackState = 'idle' | 'synthesizing' | 'playing' | 'error';
