import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from './src/screens/WelcomeScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import AuthChoiceScreen from './src/screens/AuthChoiceScreen';
import ManualSignupScreen from './src/screens/ManualSignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import MoodInputScreen from './src/screens/MoodInputScreen';
import DetectedContextScreen from './src/screens/DetectedContextScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
        <Stack.Screen name="ManualSignup" component={ManualSignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MoodInput" component={MoodInputScreen} />
        <Stack.Screen name="DetectedContext" component={DetectedContextScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}