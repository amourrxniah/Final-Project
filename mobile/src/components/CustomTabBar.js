import React, { useRef } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const scale = useRef(new Animated.Value(1)).current;
          const glow = useRef(new Animated.Value(0)).current;

          const onPress = () => {
            Animated.spring(scale, {
              toValue: 1.25,
              useNativeDriver: true,
              friction: 4,
            }).start(() => {
              Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                friction: 3,
              }).start();
            });

            Animated.timing(glow, {
              toValue: 1,
              duration: 200,
              useNativeDriver: false,
            }).start(() => glow.setValue(0));

            navigation.navigate(route.name);
          };

          // icons
          let iconName;
          if (route.name === "Home") iconName = "home";
          else if (route.name === "MoodInput") iconName = "star-outline";
          else if (route.name === "MyActivities") iconName = "bookmark-outline";
          else if (route.name === "Profile") iconName = "account-outline";
          else if (route.name === "Settings") iconName = "cog-outline";

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tab}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                <Animated.View
                  style={{
                    shadowColor: "#9b5de5",
                    shadowOpacity: glow,
                    shadowRadius: 12,
                  }}
                >
                  <MaterialCommunityIcons
                    name={iconName}
                    size={isFocused ? 44 : 36}
                    color={isFocused ? "#9b5de5" : "#aaa"}
                  />
                </Animated.View>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: "center",
  },

  container: {
    flexDirection: "row",
    height: 50,
    borderRadius: 32,
    backgroundColor: "#fff",
    paddingHorizontal: 10,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },

  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
