import { createContext, useContext, type PropsWithChildren } from 'react';

import type { MixService } from '../services';
import { useTextMixerFlow } from './useTextMixerFlow';
import type { TextMixerFlow } from './useTextMixerFlow.types';

type TextMixerProviderProps = PropsWithChildren<{
  mixService?: MixService;
}>;

const TextMixerContext = createContext<TextMixerFlow | null>(null);

export function TextMixerProvider({ children, mixService }: TextMixerProviderProps) {
  const flow = useTextMixerFlow({ mixService });

  return <TextMixerContext.Provider value={flow}>{children}</TextMixerContext.Provider>;
}

export function useTextMixer(): TextMixerFlow {
  const context = useContext(TextMixerContext);

  if (!context) {
    throw new Error('useTextMixer must be used inside TextMixerProvider.');
  }

  return context;
}
