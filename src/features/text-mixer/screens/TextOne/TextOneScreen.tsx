import { Text, VStack } from '@gluestack-ui/themed';

import { TextEntryStepView, VoiceCaptureButton } from '../../components';
import { useTextOneScreen } from './useTextOneScreen';

export function TextOneScreen() {
  const view = useTextOneScreen();

  return (
    <TextEntryStepView
      contentAnimatedStyle={view.contentAnimatedStyle}
      ctaAnimatedStyle={view.ctaAnimatedStyle}
      ctaContainerAnimatedStyle={view.ctaContainerAnimatedStyle}
      ctaIntroAnimatedStyle={view.ctaIntroAnimatedStyle}
      ctaLabel="Use as source"
      counterText={`${view.sourceText.trim().length}/1200`}
      description="Add the text whose meaning should stay intact."
      errorMessage={
        view.isErrorVisible && view.errorMessage
          ? {
              animatedStyle: view.errorAnimatedStyle,
              colorToken: '$error600',
              text: view.errorMessage,
            }
          : null
      }
      fieldAuxiliarySlot={
        <VStack space="sm">
          <VoiceCaptureButton
            durationMs={view.voiceCaptureDurationMs}
            recordingState={view.voiceCaptureState}
            onPress={view.onVoiceCapturePress}
            isDisabled={view.isInteractionLocked}
          />
          {view.voiceCaptureErrorMessage ? (
            <Text size="sm" color="$error600">
              {view.voiceCaptureErrorMessage}
            </Text>
          ) : null}
        </VStack>
      }
      fieldAnimatedStyle={[view.fieldIntroAnimatedStyle, view.fieldAnimatedStyle]}
      fieldContentAnimatedStyle={view.fieldContentAnimatedStyle}
      fieldRef={view.fieldRef}
      textareaRef={view.textareaRef}
      footerAnimatedStyle={view.footerAnimatedStyle}
      headerAnimatedStyle={view.headerIntroAnimatedStyle}
      isCtaDisabled={!view.canContinue || view.isInteractionLocked || view.isVoiceCaptureBusy}
      isReadOnly={view.isInteractionLocked}
      metaAnimatedStyle={view.metaIntroAnimatedStyle}
      onChangeText={view.onChangeSourceText}
      onFieldLayout={view.onTextareaLayout}
      onSubmit={view.onContinue}
      placeholder="Type or paste the source text..."
      shouldExpandField={!view.isHandingOff}
      statusMessage={
        view.isSourceConfirmationMessageVisible
          ? {
              animatedStyle: view.sourceConfirmedAnimatedStyle,
              colorToken: '$success600',
              text: 'Source locked in',
            }
          : null
      }
      title="Source text"
      value={view.sourceText}
    />
  );
}
