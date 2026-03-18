import { View } from 'react-native';
import { Text, VStack } from '@gluestack-ui/themed';
import Animated from 'react-native-reanimated';

import type { ResultRevealCardProps } from './ResultRevealCard.types';
import { useResultRevealCard } from './useResultRevealCard';

const AnimatedView = Animated.createAnimatedComponent(View);

export function ResultRevealCard({ output }: ResultRevealCardProps) {
  const { cardAnimatedStyle, cursorVisible, visibleText } = useResultRevealCard(output);

  return (
    <AnimatedView style={cardAnimatedStyle}>
      <VStack pt="$2" w="$full" alignItems="flex-start">
        <Text size="xl" color="$textLight900" lineHeight="$2xl" textAlign="left">
          {visibleText}
          {cursorVisible ? (
            <Text size="xl" color="$textLight500" lineHeight="$2xl">
              |
            </Text>
          ) : null}
        </Text>
      </VStack>
    </AnimatedView>
  );
}
