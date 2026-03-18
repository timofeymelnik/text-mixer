import { Text, VStack } from '@gluestack-ui/themed';
import { TextEntryStepView, TextPill, VoiceCaptureButton } from '../../components';
import Animated from 'react-native-reanimated';

import { useTextTwoScreen } from './useTextTwoScreen';

const AnimatedView = Animated.View;

export function TextTwoScreen() {
  const view = useTextTwoScreen();

  return (
    <TextEntryStepView
      contentAnimatedStyle={view.contentAnimatedStyle}
      ctaAnimatedStyle={view.ctaAnimatedStyle}
      ctaContainerAnimatedStyle={view.ctaContainerAnimatedStyle}
      ctaIntroAnimatedStyle={view.ctaIntroAnimatedStyle}
      ctaLabel="Rewrite in this style"
      counterText={`${view.styleReferenceText.trim().length}/1200`}
      description="Add a reference text whose tone and rhythm should guide the rewrite."
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
            isDisabled={view.isHandingOff}
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
      isCtaDisabled={!view.canMix || view.isHandingOff || view.isVoiceCaptureBusy}
      isReadOnly={view.isHandingOff}
      metaAnimatedStyle={view.metaIntroAnimatedStyle}
      onChangeText={view.onChangeStyleReferenceText}
      onFieldLayout={view.onTextareaLayout}
      onSubmit={view.onMix}
      placeholder="Paste a style reference..."
      previewSlot={
        view.isTextPillVisible ? (
          <AnimatedView
            ref={view.textPillRef}
            style={[view.textPillAnimatedStyle, { opacity: view.shouldHideSharedPreview ? 0 : 1 }]}
            onLayout={view.onTextPillLayout}
          >
            <TextPill label="Source text" text={view.sourcePreview} colorScheme="overlay" />
          </AnimatedView>
        ) : null
      }
      showCta={view.introVisibleSections.cta}
      showField={view.introVisibleSections.field}
      showMeta={view.introVisibleSections.meta}
      shouldExpandField={!view.isHandingOff}
      title="Style reference"
      value={view.styleReferenceText}
    />
  );
}
