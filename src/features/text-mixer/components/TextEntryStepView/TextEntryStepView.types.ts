import type { ReactNode, RefObject } from 'react';
import type { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';

export type StepFeedbackMessage = {
  animatedStyle?: StyleProp<ViewStyle>;
  colorToken: string;
  isVisible?: boolean;
  text: string;
};

export type TextEntryStepViewProps = {
  contentAnimatedStyle?: StyleProp<ViewStyle>;
  ctaAnimatedStyle?: StyleProp<ViewStyle>;
  ctaContainerAnimatedStyle?: StyleProp<ViewStyle>;
  ctaIntroAnimatedStyle?: StyleProp<ViewStyle>;
  ctaLabel: string;
  counterText: string;
  description: string;
  errorMessage?: StepFeedbackMessage | null;
  fieldAuxiliarySlot?: ReactNode;
  fieldAnimatedStyle?: StyleProp<ViewStyle>;
  fieldContentAnimatedStyle?: StyleProp<ViewStyle>;
  fieldRef: RefObject<View | null>;
  textareaRef?: RefObject<View | null>;
  footerAnimatedStyle?: StyleProp<ViewStyle>;
  headerAnimatedStyle?: StyleProp<ViewStyle>;
  isCtaDisabled: boolean;
  isReadOnly?: boolean;
  metaAnimatedStyle?: StyleProp<ViewStyle>;
  onChangeText: (value: string) => void;
  onFieldLayout: (event: LayoutChangeEvent) => void;
  onSubmit: () => void;
  placeholder: string;
  previewSlot?: ReactNode;
  showCta?: boolean;
  showField?: boolean;
  showHeader?: boolean;
  showMeta?: boolean;
  shouldExpandField?: boolean;
  statusMessage?: StepFeedbackMessage | null;
  title: string;
  value: string;
};
