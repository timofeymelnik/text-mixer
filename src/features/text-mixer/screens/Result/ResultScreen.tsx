import { Box, Heading, ScrollView, Text, VStack } from '@gluestack-ui/themed';

import { AudioListenButton, DepthButton, ResultRevealCard } from '../../components';
import { TEXT_MIXER_SCREEN_CONTENT_TOP_OFFSET } from '../../layout';
import { useResultScreen } from './useResultScreen';

export function ResultScreen() {
  const view = useResultScreen();

  return (
    <Box flex={1} bg="$white" px="$5" pt="$12" pb="$6">
      <VStack flex={1} space="xl" pt={TEXT_MIXER_SCREEN_CONTENT_TOP_OFFSET}>
        <VStack space="sm">
          <Heading size="2xl" color="$textLight900">
            Result
          </Heading>
          <Text size="sm" color="$textLight500">
            Your rewritten text is ready.
          </Text>
        </VStack>

        <ScrollView flex={1} contentContainerStyle={{ paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
          <VStack space="md">
            <ResultRevealCard output={view.output} />
            <AudioListenButton
              onPress={view.onListen}
              isDisabled={!view.output.trim() || view.isAudioBusy}
              isPlaying={view.isAudioPlaying}
              isSynthesizing={view.isAudioBusy}
            />
            {view.audioErrorMessage ? (
              <Text size="sm" color="$error600">
                {view.audioErrorMessage}
              </Text>
            ) : null}
          </VStack>
        </ScrollView>

        <DepthButton label="Start over" onPress={view.onNewBlend} />
      </VStack>
    </Box>
  );
}
