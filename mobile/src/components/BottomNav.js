import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { forwardRef } from "react";

const NavIcon = forwardRef(({ name, color, onPress }, ref) => {
  return (
    <TouchableOpacity
      ref={ref}
      style={styles.navIcon}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={name} size={45} color={color} />
    </TouchableOpacity>
  );
});

export default function BottomNav({
  navigation,
  active,
  favouriteRef,
  bookmarkPulse,
}) {
  const safePulse = bookmarkPulse ?? new Animated.Value(1);

  const getIconColor = (iconName) => {
    const routeMap = {
      home: "home",
      star: "star-outline",
      bookmark: "bookmark-outline",
      account: "account-outline",
      cog: "cog-outline",
    };

    // map the route names correctly
    if (active === "home" && iconName === "home") return "#9b5de5";
    if (active === "mood" && iconName === "star-outline") return "#9b5de5";
    if (active === "favourites" && iconName === "bookmark-outline")
      return "#9b5de5";
    if (active === "profile" && iconName === "account-outline")
      return "#9b5de5";
    if (active === "settings" && iconName === "cog-outline") return "#9b5de5";
    return "#aaa";
  };

  return (
    <View style={styles.navWrapper}>
      <View style={styles.navBar}>
        <NavIcon
          name="home"
          color={getIconColor("home")}
          onPress={() => navigation.navigate("Home")}
        />
        <NavIcon
          name="star-outline"
          color={getIconColor("star-outline")}
          onPress={() => navigation.navigate("MoodInput")}
        />
        <Animated.View style={{ transform: [{ scale: safePulse }] }}>
          <NavIcon
            name="bookmark-outline"
            color={getIconColor("bookmark-outline")}
            ref={favouriteRef}
            onPress={() => navigation.navigate("MyActivities")}
          />
        </Animated.View>

        <NavIcon
          name="account-outline"
          color={getIconColor("account-outline")}
          onPress={() => navigation.navigate("Profile")}
        />
        <NavIcon
          name="cog-outline"
          color={getIconColor("cog-outline")}
          onPress={() => navigation.navigate("Settings")}
        />
      </View>
    </View>
  );
}

export { NavIcon };

const styles = StyleSheet.create({
  navWrapper: {
    position: "absolute",
    bottom: 18,
    width: "100%",
    alignItems: "center",
    zIndex: 1000,
  },

  navBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#eee",
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },

  navIcon: {
    paddingHorizontal: 10,
  },
});
