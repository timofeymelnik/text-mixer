import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

type UseMeasuredHeightOptions = {
  isLocked: boolean;
};

export function useMeasuredHeight({ isLocked }: UseMeasuredHeightOptions) {
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (isLocked) {
        return;
      }

      const nextHeight = event.nativeEvent.layout.height;

      setMeasuredHeight((previous) => {
        if (previous !== null && Math.abs(previous - nextHeight) < 1) {
          return previous;
        }

        return nextHeight;
      });
    },
    [isLocked],
  );

  return {
    measuredHeight,
    onLayout,
  };
}
