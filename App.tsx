import { NavigationContainer } from '@react-navigation/native';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config as gluestackConfig } from '@gluestack-ui/config';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from './src/navigation/AppNavigator';
import { TextInputSharedTransitionProvider } from './src/features/text-mixer/model/TextInputSharedTransitionProvider';
import { TextMixerProvider } from './src/features/text-mixer/model/TextMixerProvider';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GluestackUIProvider config={gluestackConfig}>
        <TextMixerProvider>
          <TextInputSharedTransitionProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </TextInputSharedTransitionProvider>
        </TextMixerProvider>
      </GluestackUIProvider>
    </GestureHandlerRootView>
  );
}
