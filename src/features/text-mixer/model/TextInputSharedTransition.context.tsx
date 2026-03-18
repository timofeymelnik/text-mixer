import { createContext, useContext } from 'react';

export type SharedLayout = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type SharedTransitionKey = 'text1-preview' | 'text2-preview';
export type SharedTransitionColorScheme = 'primary' | 'secondary' | 'overlay';
export type SharedTransitionVariant = 'field' | 'pill' | 'block';

export type SharedTransitionPayload = {
  colorScheme: SharedTransitionColorScheme;
  label: string;
  sourceText: string;
  targetText: string;
  sourceVariant: SharedTransitionVariant;
  targetVariant: SharedTransitionVariant;
};

export type ActiveTransition = {
  createdAt: number;
  key: SharedTransitionKey;
  payload: SharedTransitionPayload;
  sourceLayout: SharedLayout;
  targetLayout: SharedLayout | null;
};

export type TextInputSharedTransitionContextValue = {
  activeTransitions: ActiveTransition[];
  beginTransition: (key: SharedTransitionKey, payload: SharedTransitionPayload, sourceLayout: SharedLayout) => void;
  clearAllTransitions: () => void;
  completeTransition: (key: SharedTransitionKey) => void;
  isTargetHidden: (key: SharedTransitionKey) => boolean;
  registerTargetLayout: (key: SharedTransitionKey, layout: SharedLayout) => void;
};

export const TextInputSharedTransitionContext = createContext<TextInputSharedTransitionContextValue | null>(null);

export function useTextInputSharedTransition() {
  const context = useContext(TextInputSharedTransitionContext);

  if (!context) {
    throw new Error('useTextInputSharedTransition must be used inside TextInputSharedTransitionProvider.');
  }

  return context;
}
