import type { RefObject } from 'react';
import { View } from 'react-native';
import { Box, Text, VStack } from '@gluestack-ui/themed';
import Animated from 'react-native-reanimated';
import { useMemo } from 'react';

import type { StepwiseMergeProps } from './StepwiseMerge.types';
import type { CenterGlyph, SourceGlyph } from './stepwiseMerge.helpers';
import { useStepwiseMerge } from './useStepwiseMerge';

const AnimatedView = Animated.createAnimatedComponent(View);

function groupSourceGlyphs(glyphs: SourceGlyph[]) {
  return glyphs.reduce<Array<{ key: string; text: string; hidden: boolean }>>((segments, glyph, index) => {
    const previous = segments[segments.length - 1];

    if (previous && previous.hidden === glyph.hidden) {
      previous.text += glyph.char;
      return segments;
    }

    segments.push({
      key: `source-${index}`,
      text: glyph.char,
      hidden: glyph.hidden,
    });

    return segments;
  }, []);
}

function groupCenterGlyphs(glyphs: CenterGlyph[]) {
  return glyphs.reduce<Array<Pick<CenterGlyph, 'colorToken' | 'opacity' | 'tone'> & { key: string; text: string }>>((segments, glyph, index) => {
    const previous = segments[segments.length - 1];

    if (
      previous &&
      previous.tone === glyph.tone &&
      previous.colorToken === glyph.colorToken &&
      previous.opacity === glyph.opacity
    ) {
      previous.text += glyph.char;
      return segments;
    }

    segments.push({
      colorToken: glyph.colorToken,
      key: `center-${index}`,
      opacity: glyph.opacity,
      text: glyph.char,
      tone: glyph.tone,
    });

    return segments;
  }, []);
}

function SourceBlock({
  blockOpacity = 1,
  labelOpacity,
  label,
  glyphs,
  onLayout,
  viewRef,
}: {
  blockOpacity?: number;
  glyphs: SourceGlyph[];
  label: string;
  labelOpacity: number;
  onLayout?: () => void;
  viewRef?: RefObject<View | null>;
}) {
  const glyphSegments = useMemo(() => groupSourceGlyphs(glyphs), [glyphs]);

  return (
    <AnimatedView ref={viewRef} style={{ width: '100%', opacity: blockOpacity }} onLayout={onLayout}>
      <Box
        w="$full"
        bg="$white"
        borderRadius="$xl"
        borderWidth="$1"
        borderColor="$white"
        px="$4"
        py="$4"
      >
        <VStack space="sm">
          <Text size="xs" color="$black" fontWeight="$medium" opacity={labelOpacity}>
            {label}
          </Text>
          <Text size="sm" color="$black" lineHeight="$lg">
            {glyphSegments.map((segment) => (
              <Text key={`${label}-${segment.key}`} size="sm" color="$black" opacity={segment.hidden ? 0 : 1}>
                {segment.text}
              </Text>
            ))}
          </Text>
        </VStack>
      </Box>
    </AnimatedView>
  );
}

export function StepwiseMerge({
  elapsedMs,
  handoffElapsedMs = 0,
  isSourceTargetHidden = false,
  isStyleReferenceTargetHidden = false,
  onSourceTargetLayout,
  onStyleReferenceTargetLayout,
  phase,
  sourceText,
  styleReferenceText,
  sourceTargetRef,
  styleReferenceTargetRef,
}: StepwiseMergeProps) {
  const view = useStepwiseMerge({ elapsedMs, handoffElapsedMs, phase, sourceText, styleReferenceText });
  const centerText = useMemo(
    () =>
      view.centerGlyphs.length
        ? view.centerGlyphs
        : [{ char: '', colorToken: '$black' as const, opacity: 1, tone: 'resolved' as const }],
    [view.centerGlyphs],
  );
  const centerSegments = useMemo(() => groupCenterGlyphs(centerText), [centerText]);

  return (
    <VStack w="$full" alignItems="stretch" space="lg">
      <SourceBlock
        blockOpacity={isSourceTargetHidden ? 0 : 1}
        glyphs={view.sourceGlyphs1}
        label="Source text"
        labelOpacity={view.labelOpacity}
        onLayout={onSourceTargetLayout}
        viewRef={sourceTargetRef}
      />

      <SourceBlock
        blockOpacity={isStyleReferenceTargetHidden ? 0 : 1}
        glyphs={view.sourceGlyphs2}
        label="Style reference"
        labelOpacity={view.labelOpacity}
        onLayout={onStyleReferenceTargetLayout}
        viewRef={styleReferenceTargetRef}
      />

      <VStack minHeight={96} w="$full" alignItems="flex-start" justifyContent="center" px="$2" pt="$2">
        <Text size="2xl" textAlign="left" lineHeight="$3xl">
          {centerSegments.map((segment) => (
            <Text key={segment.key} size="2xl" color={segment.colorToken} opacity={segment.opacity}>
              {segment.text}
            </Text>
          ))}
        </Text>
      </VStack>
    </VStack>
  );
}
