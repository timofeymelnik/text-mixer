import { useCallback, useEffect, useRef, useState } from 'react';

import { scaleAnimationMs } from './animationSpeed';
import { useAnimatedPresence } from './useAnimatedPresence';

type IntroSections = {
  cta: boolean;
  field: boolean;
  header: boolean;
  meta: boolean;
};

type UseTextStepIntroOptions = {
  autoStart?: boolean;
  initialVisibility?: 'hidden' | 'visible';
  staggerMs?: number;
  startDelayMs?: number;
};

const HIDDEN_SECTIONS: IntroSections = {
  cta: false,
  field: false,
  header: false,
  meta: false,
};

const VISIBLE_SECTIONS: IntroSections = {
  cta: true,
  field: true,
  header: true,
  meta: true,
};

export function useTextStepIntro({
  autoStart = true,
  initialVisibility = 'hidden',
  staggerMs = scaleAnimationMs(90),
  startDelayMs = 0,
}: UseTextStepIntroOptions = {}) {
  const [visibleSections, setVisibleSections] = useState<IntroSections>(
    initialVisibility === 'visible' ? VISIBLE_SECTIONS : HIDDEN_SECTIONS,
  );
  const timeoutIdsRef = useRef<number[]>([]);
  const hasStartedRef = useRef(initialVisibility === 'visible');

  const clearScheduledIntro = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    timeoutIdsRef.current = [];
  }, []);

  useEffect(() => clearScheduledIntro, [clearScheduledIntro]);

  const startIntro = useCallback(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    clearScheduledIntro();
    timeoutIdsRef.current = [
      setTimeout(() => {
        setVisibleSections((previous) => ({ ...previous, header: true }));
      }, startDelayMs) as unknown as number,
      setTimeout(() => {
        setVisibleSections((previous) => ({ ...previous, field: true }));
      }, startDelayMs + staggerMs) as unknown as number,
      setTimeout(() => {
        setVisibleSections((previous) => ({ ...previous, meta: true }));
      }, startDelayMs + staggerMs * 2) as unknown as number,
      setTimeout(() => {
        setVisibleSections((previous) => ({ ...previous, cta: true }));
      }, startDelayMs + staggerMs * 3) as unknown as number,
    ];
  }, [clearScheduledIntro, staggerMs, startDelayMs]);

  useEffect(() => {
    if (!autoStart) {
      return;
    }

    startIntro();
  }, [autoStart, startIntro]);

  const headerMotion = useAnimatedPresence({
    duration: scaleAnimationMs(260),
    initialTranslateY: 18,
    isVisible: visibleSections.header,
  });
  const fieldMotion = useAnimatedPresence({
    duration: scaleAnimationMs(260),
    hiddenScale: 0.985,
    initialTranslateY: 24,
    isVisible: visibleSections.field,
  });
  const metaMotion = useAnimatedPresence({
    duration: scaleAnimationMs(260),
    initialTranslateY: 20,
    isVisible: visibleSections.meta,
  });
  const ctaMotion = useAnimatedPresence({
    duration: scaleAnimationMs(260),
    hiddenScale: 0.985,
    initialTranslateY: 24,
    isVisible: visibleSections.cta,
  });

  return {
    ctaAnimatedStyle: ctaMotion.animatedStyle,
    fieldAnimatedStyle: fieldMotion.animatedStyle,
    headerAnimatedStyle: headerMotion.animatedStyle,
    metaAnimatedStyle: metaMotion.animatedStyle,
    startIntro,
    visibleSections,
  };
}
