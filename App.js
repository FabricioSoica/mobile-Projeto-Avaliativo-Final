import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import SplashScreen from './src/screens/SplashScreen';
import DatabaseSelectionScreen from './src/screens/DatabaseSelectionScreen';
import CrudScreen from './src/screens/CrudScreen';
import EnderecoScreen from './src/screens/EnderecoScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="DatabaseSelection" component={DatabaseSelectionScreen} />
          <Stack.Screen name="Crud" component={CrudScreen} />
          <Stack.Screen name="Endereco" component={EnderecoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

