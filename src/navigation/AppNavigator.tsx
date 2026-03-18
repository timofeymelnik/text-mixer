import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './navigation.types';
import { TextOneScreen } from '../features/text-mixer/screens/TextOne';
import { TextTwoScreen } from '../features/text-mixer/screens/TextTwo';
import { MixingScreen } from '../features/text-mixer/screens/Mixing';
import { ResultScreen } from '../features/text-mixer/screens/Result';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="TextOne"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="TextOne" component={TextOneScreen} />
      <Stack.Screen name="TextTwo" component={TextTwoScreen} />
      <Stack.Screen name="Mixing" component={MixingScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}
