import { Box, Text, VStack } from '@gluestack-ui/themed';

import type { TextPillProps } from './TextPill.types';

export function TextPill({ text, label, colorScheme = 'primary', opacity }: TextPillProps) {
  const isSecondary = colorScheme === 'secondary';
  const isOverlay = colorScheme === 'overlay';

  return (
    <Box
      bg={'$white'}
      borderWidth="$1"
      borderColor="$white"
      borderRadius="$xl"
      px="$4"
      py="$3"
      sx={{
        opacity: 1,
        elevation: isOverlay ? 0 : 1,
      }}
    >
      <VStack space="sm">
        {label ? (
          <Text
            size="xs"
            color={isOverlay ? '$black' : isSecondary ? '$secondary700' : '$primary700'}
            fontWeight="$medium"
          >
            {label}
          </Text>
        ) : null}
        <Text size="sm" color={isOverlay ? '$black' : isSecondary ? '$secondary900' : '$primary900'}>
          {text}
        </Text>
      </VStack>
    </Box>
  );
}
