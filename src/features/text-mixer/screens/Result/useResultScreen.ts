import { useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useResultAudio, useTextMixer } from '../../model';
import { useTextInputSharedTransition } from '../../model/TextInputSharedTransition.context';
import type { RootStackParamList } from '../../../../navigation/navigation.types';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'Result'>;

export function useResultScreen() {
  const navigation = useNavigation<Navigation>();
  const { state, actions } = useTextMixer();
  const { clearAllTransitions } = useTextInputSharedTransition();
  const resultAudio = useResultAudio({
    text: state.result?.output ?? '',
  });

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    clearAllTransitions();
  }, [clearAllTransitions]);

  const onNewBlend = useCallback(() => {
    actions.resetAll();
    navigation.replace('TextOne');
  }, [actions, navigation]);

  return {
    audioErrorMessage: resultAudio.errorMessage,
    isAudioBusy: resultAudio.isBusy,
    isAudioPlaying: resultAudio.isPlaying,
    output: state.result?.output ?? '',
    onListen: resultAudio.onListen,
    onNewBlend,
  };
}
