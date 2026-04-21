import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CustomTabBar from "./src/components/CustomTabBar";

import HomeScreen from "./src/screens/HomeScreen";
import MoodInputScreen from "./src/screens/MoodInputScreen";
import RecommendationsScreen from "./src/screens/RecommendationsScreen";
import MyActivitiesScreen from "./src/screens/MyActivitiesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* main app screens */}
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MoodInput" component={MoodInputScreen} />
      <Tab.Screen name="Recommendations" component={RecommendationsScreen} />
      <Tab.Screen name="MyActivities" component={MyActivitiesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
