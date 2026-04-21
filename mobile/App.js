import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import PrivacyScreen from "./src/screens/PrivacyScreen";
import AuthChoiceScreen from "./src/screens/AuthChoiceScreen";
import ManualLoginScreen from "./src/screens/ManualLoginScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import ManualSignupScreen from "./src/screens/ManualSignupScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MoodInputScreen from "./src/screens/MoodInputScreen";
import DetectedContextScreen from "./src/screens/DetectedContextScreen";
import OverviewScreen from "./src/screens/OverviewScreen";
import RecommendationsScreen from "./src/screens/RecommendationsScreen";
import ActivityDetailsScreen from "./src/screens/ActivityDetailsScreen";
import MyActivitiesScreen from "./src/screens/MyActivitiesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ConnectedAccountsScreen from "./src/components/ConnectedAccountsScreen";
import MainTabs from "./MainTabs";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          animation: "slide_from_right",
          gestureEnabled: true,
          headerShown: false,
        }}
      >
        {/* auth screens */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
        <Stack.Screen name="ManualLogin" component={ManualLoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ManualSignup" component={ManualSignupScreen} />
        
        {/* main app screens */}
        <Stack.Screen name="MainTabs" component={MainTabs} />

        {/* other screens */}
        <Stack.Screen
          name="DetectedContext"
          component={DetectedContextScreen}
        />
        <Stack.Screen name="Overview" component={OverviewScreen} />
        <Stack.Screen
          name="Recommendations"
          component={RecommendationsScreen}
        />
        <Stack.Screen
          name="ActivityDetails"
          component={ActivityDetailsScreen}
        />
        <Stack.Screen name="Accounts" component={ConnectedAccountsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
