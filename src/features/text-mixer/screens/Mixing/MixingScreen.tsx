import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';

import { DepthButton, OrbitalMerge } from '../../components';
import { TEXT_MIXER_SCREEN_CONTENT_TOP_OFFSET } from '../../layout';
import { useMixingScreen } from './useMixingScreen';

export function MixingScreen() {
  const view = useMixingScreen();

  return (
    <Box flex={1} px="$5" pt="$12" pb="$6" bg="$white">
      <VStack
        flex={1}
        alignItems="center"
        justifyContent="flex-start"
        space="xl"
        pt={TEXT_MIXER_SCREEN_CONTENT_TOP_OFFSET}
      >
        <VStack w="$full" space="sm" opacity={0} pointerEvents="none">
          <Heading size="2xl" color="$textLight900">
            Style reference
          </Heading>
          <Text size="sm" color="$textLight500">
            Add a reference text whose tone and rhythm should guide the rewrite.
          </Text>
        </VStack>

        <OrbitalMerge
          elapsedMs={view.elapsedMs}
          handoffElapsedMs={view.handoffElapsedMs}
          sourceText={view.sourcePreview}
          styleReferenceText={view.styleReferencePreview}
          phase={view.animationPhase}
          sourceTargetRef={view.sourceTargetRef}
          styleReferenceTargetRef={view.styleReferenceTargetRef}
          onSourceTargetLayout={view.onSourceTargetLayout}
          onStyleReferenceTargetLayout={view.onStyleReferenceTargetLayout}
          isSourceTargetHidden={view.isSourceTargetHidden}
          isStyleReferenceTargetHidden={view.isStyleReferenceTargetHidden}
        />

        {view.errorMessage ? (
          <VStack w="$full" space="md" mt="auto">
            <Text size="sm" color="$error600" textAlign="center">
              {view.errorMessage}
            </Text>
            <DepthButton label="Retry" onPress={view.onRetry} />
            <DepthButton label="Back to input" onPress={view.onBack} />
          </VStack>
        ) : null}
      </VStack>
    </Box>
  );
}
