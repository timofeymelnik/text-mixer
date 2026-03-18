import '@testing-library/jest-native/extend-expect';

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');

  const createAnimatedComponent = (Component: typeof View) => {
    return React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(Component, { ...props, ref }),
    );
  };

  const mock = {
    View,
    createAnimatedComponent,
    useSharedValue: (value: unknown) => React.useRef({ value }).current,
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    withTiming: (value: unknown) => value,
    withRepeat: (value: unknown) => value,
    withSequence: (...values: unknown[]) => values[values.length - 1],
    cancelAnimation: jest.fn(),
    Easing: {
      linear: jest.fn(),
      cubic: jest.fn(),
      ease: jest.fn(),
      out: jest.fn((value) => value),
      in: jest.fn((value) => value),
      inOut: jest.fn((value) => value),
    },
  };

  return {
    __esModule: true,
    ...mock,
    default: mock,
  };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Medium: 'medium',
  },
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

jest.mock('expo-audio', () => {
  const mockRecorder = {
    uri: null as string | null,
    prepareToRecordAsync: jest.fn().mockResolvedValue(undefined),
    record: jest.fn(),
    stop: jest.fn().mockImplementation(async () => {
      mockRecorder.uri = 'file://recording.m4a';
    }),
    pause: jest.fn(),
  };
  const mockRecorderState = {
    canRecord: true,
    durationMillis: 0,
    isRecording: false,
  };
  const mockPlayer = {
    pause: jest.fn(),
    play: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn().mockResolvedValue(undefined),
  };
  const mockPlayerStatus = {
    currentTime: 0,
    didJustFinish: false,
    duration: 0,
    isPlaying: false,
  };

  return {
    __esModule: true,
    __mockPlayer: mockPlayer,
    __mockPlayerStatus: mockPlayerStatus,
    __mockRecorder: mockRecorder,
    __mockRecorderState: mockRecorderState,
    getRecordingPermissionsAsync: jest.fn().mockResolvedValue({
      granted: true,
      status: 'granted',
    }),
    RecordingPresets: {
      HIGH_QUALITY: {},
    },
    requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({
      granted: true,
      status: 'granted',
    }),
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
    useAudioPlayer: jest.fn(() => mockPlayer),
    useAudioPlayerStatus: jest.fn(() => mockPlayerStatus),
    useAudioRecorder: jest.fn(() => mockRecorder),
    useAudioRecorderState: jest.fn(() => mockRecorderState),
  };
});
