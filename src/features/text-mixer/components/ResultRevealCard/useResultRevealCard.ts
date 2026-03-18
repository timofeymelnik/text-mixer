import { useEffect, useMemo, useRef, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { scaleAnimationMs } from '../../model/animationSpeed';
import { MOTION_CURVES } from '../../model/motionCurves';

export type ResultRevealStage = 'intro' | 'typing' | 'done';

const CARD_REVEAL_DELAY_MS = scaleAnimationMs(160);
const TYPEWRITER_STEP_MS = scaleAnimationMs(60);
const CURSOR_BLINK_MS = scaleAnimationMs(420);

export function useResultRevealCard(output: string) {
  const [stage, setStage] = useState<ResultRevealStage>('intro');
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const introTimeoutRef = useRef<number | null>(null);
  const typingIntervalRef = useRef<number | null>(null);
  const cursorIntervalRef = useRef<number | null>(null);
  const outputWords = useMemo(() => output.match(/\S+\s*/g) ?? [], [output]);

  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const cardScale = useSharedValue(0.98);

  useEffect(() => {
    cardOpacity.value = 0;
    cardTranslateY.value = 20;
    cardScale.value = 0.98;
    setStage('intro');
    setVisibleWordCount(0);
    setCursorVisible(true);

    cardOpacity.value = withTiming(1, { duration: scaleAnimationMs(340), easing: MOTION_CURVES.gentleOut });
    cardTranslateY.value = withTiming(0, { duration: scaleAnimationMs(340), easing: MOTION_CURVES.gentleOut });
    cardScale.value = withTiming(1, { duration: scaleAnimationMs(340), easing: MOTION_CURVES.gentleOut });

    introTimeoutRef.current = setTimeout(() => {
      setStage('typing');
      typingIntervalRef.current = setInterval(() => {
        setVisibleWordCount((previous) => {
          const next = Math.min(outputWords.length, previous + 1);

          if (next >= outputWords.length) {
            if (typingIntervalRef.current !== null) {
              clearInterval(typingIntervalRef.current);
              typingIntervalRef.current = null;
            }

            setStage('done');
          }

          return next;
        });
      }, TYPEWRITER_STEP_MS) as unknown as number;
    }, CARD_REVEAL_DELAY_MS) as unknown as number;

    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible((previous) => !previous);
    }, CURSOR_BLINK_MS) as unknown as number;

    return () => {
      if (introTimeoutRef.current !== null) {
        clearTimeout(introTimeoutRef.current);
      }

      if (typingIntervalRef.current !== null) {
        clearInterval(typingIntervalRef.current);
      }

      if (cursorIntervalRef.current !== null) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [cardOpacity, cardScale, cardTranslateY, outputWords]);

  useEffect(() => {
    if (stage === 'done') {
      if (cursorIntervalRef.current !== null) {
        clearInterval(cursorIntervalRef.current);
        cursorIntervalRef.current = null;
      }

      setCursorVisible(false);
    }
  }, [stage]);

  const visibleText = useMemo(() => outputWords.slice(0, visibleWordCount).join(''), [outputWords, visibleWordCount]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }, { scale: cardScale.value }],
  }));

  return {
    cardAnimatedStyle,
    cursorVisible,
    stage,
    visibleText,
  };
}
