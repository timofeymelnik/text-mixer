import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Box, Heading, Text, Textarea, TextareaInput, VStack } from '@gluestack-ui/themed';
import Animated from 'react-native-reanimated';

import { TEXT_MIXER_SCREEN_CONTENT_TOP_OFFSET } from '../../layout';
import { DepthButton } from '../DepthButton';
import type { StepFeedbackMessage, TextEntryStepViewProps } from './TextEntryStepView.types';

const AnimatedView = Animated.View;
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

function renderFeedbackMessage(message?: StepFeedbackMessage | null) {
  if (!message || message.isVisible === false) {
    return null;
  }

  return (
    <AnimatedView style={message.animatedStyle}>
      <Text size="sm" color={message.colorToken}>
        {message.text}
      </Text>
    </AnimatedView>
  );
}

export function TextEntryStepView({
  contentAnimatedStyle,
  ctaAnimatedStyle,
  ctaContainerAnimatedStyle,
  ctaIntroAnimatedStyle,
  ctaLabel,
  counterText,
  description,
  errorMessage,
  fieldAuxiliarySlot,
  fieldAnimatedStyle,
  fieldContentAnimatedStyle,
  fieldRef,
  textareaRef,
  footerAnimatedStyle,
  headerAnimatedStyle,
  isCtaDisabled,
  isReadOnly = false,
  metaAnimatedStyle,
  onChangeText,
  onFieldLayout,
  onSubmit,
  placeholder,
  previewSlot,
  showCta = true,
  showField = true,
  showHeader = true,
  showMeta = true,
  shouldExpandField = true,
  statusMessage,
  title,
  value,
}: TextEntryStepViewProps) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
      <Box flex={1} px="$5" pt="$12" pb="$6" bg="$white">
        <Box flex={1} pt={TEXT_MIXER_SCREEN_CONTENT_TOP_OFFSET}>
          <AnimatedView style={[styles.flex, contentAnimatedStyle]}>
            <VStack flex={1} space="xl">
              {showHeader ? (
                <AnimatedView style={footerAnimatedStyle}>
                  <AnimatedView style={headerAnimatedStyle}>
                    <VStack space="sm">
                      <Heading size="2xl" color="$textLight900">
                        {title}
                      </Heading>
                      <Text size="sm" color="$textLight500">
                        {description}
                      </Text>
                    </VStack>
                  </AnimatedView>
                </AnimatedView>
              ) : null}

              {previewSlot}

              {showField ? (
                <AnimatedView
                  ref={fieldRef}
                  style={[shouldExpandField ? styles.flex : undefined, fieldAnimatedStyle]}
                  onLayout={onFieldLayout}
                >
                  <AnimatedView style={[styles.flex, fieldContentAnimatedStyle]}>
                    <VStack space="sm" flex={1}>
                      <AnimatedView ref={textareaRef} style={styles.flex}>
                        <Textarea
                          flex={1}
                          size="lg"
                          borderWidth="$1"
                          borderColor="$white"
                          borderRadius="$xl"
                          bg="$white"
                          sx={{
                            _focus: {
                              borderColor: '$white',
                            },
                            ':focus': {
                              outlineWidth: 0,
                              outlineColor: 'transparent',
                              boxShadow: 'none',
                            },
                          }}
                        >
                          <TextareaInput
                            value={value}
                            onChangeText={onChangeText}
                            placeholder={placeholder}
                            color="$textLight900"
                            placeholderTextColor="$textLight400"
                            textAlignVertical="top"
                            readOnly={isReadOnly}
                          />
                        </Textarea>
                      </AnimatedView>
                      {fieldAuxiliarySlot}
                    </VStack>
                  </AnimatedView>
                </AnimatedView>
              ) : null}

              {showMeta ? (
                <AnimatedView style={[metaAnimatedStyle, footerAnimatedStyle]}>
                  <VStack space="sm">
                    <Text size="xs" color="$textLight500">
                      {counterText}
                    </Text>
                    {renderFeedbackMessage(errorMessage)}
                    {renderFeedbackMessage(statusMessage)}
                  </VStack>
                </AnimatedView>
              ) : null}

              {showCta ? (
                <AnimatedView style={[ctaIntroAnimatedStyle, ctaContainerAnimatedStyle]}>
                  <AnimatedView style={ctaAnimatedStyle}>
                    <DepthButton label={ctaLabel} onPress={onSubmit} isDisabled={isCtaDisabled} />
                  </AnimatedView>
                </AnimatedView>
              ) : null}
            </VStack>
          </AnimatedView>
        </Box>
      </Box>
    </KeyboardAvoidingView>
  );
}
