import type { RecordingState } from '../../types';

export type VoiceCaptureButtonProps = {
  durationMs?: number;
  isDisabled?: boolean;
  onPress: () => void;
  recordingState: RecordingState;
};
