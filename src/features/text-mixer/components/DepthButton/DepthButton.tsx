import { Box, Button, ButtonText } from '@gluestack-ui/themed';
import Animated from 'react-native-reanimated';

import type { DepthButtonProps } from './DepthButton.types';
import { useDepthButton } from './useDepthButton';

const AnimatedView = Animated.View;
const ACTIVE_LAYER_COLOR = '$black';
const DISABLED_BUTTON_COLOR = '$backgroundLight700';

export function DepthButton({ isDisabled = false, label, onPress }: DepthButtonProps) {
  const view = useDepthButton({ isDisabled });
  const buttonBackgroundColor = isDisabled ? DISABLED_BUTTON_COLOR : ACTIVE_LAYER_COLOR;
  const buttonBorderColor = buttonBackgroundColor;

  return (
    <Box w="$full" position="relative" pb="$1.5">
      <Box
        position="absolute"
        left={0}
        right={0}
        bottom={-1}
        h="$12"
        zIndex={-1}
        bg={'$backgroundLight500'}
        borderRadius="$xl"
        borderWidth="$1"
        borderColor={'$backgroundLight500'}
        margin='$2'
      />

      <AnimatedView style={view.animatedStyle}>
        <Button
          zIndex={1}
          h='$12'
          opacity={1}
          borderRadius="$xl"
          bg={buttonBackgroundColor}
          borderWidth="$1"
          borderColor={buttonBorderColor}
          onPress={onPress}
          onPressIn={view.onPressIn}
          onPressOut={view.onPressOut}
          isDisabled={isDisabled}
          sx={{
            minHeight: '$12',
          }}
        >
          <ButtonText color="$white" fontWeight="$bold">
            {label}
          </ButtonText>
        </Button>
      </AnimatedView>
    </Box>
  );
}
