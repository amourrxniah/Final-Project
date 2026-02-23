import { View, TouchableOpacity, StyleSheet } from "react-native";
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
            <MaterialCommunityIcons name={name} size={45} color={color}/>
        </TouchableOpacity>
    );
});

export default function BottomNav({ navigation, active, favouriteRef }) {
    const iconColor = name =>
        active === name ? "#9b5de5" : "#aaa";

    return (
        <View style={styles.navWrapper}>
            <View style={styles.navBar}>
                <NavIcon 
                    name="home"
                    color={iconColor("home")}
                    onPress={() => navigation.navigate("Home")}
                />
                <NavIcon 
                    name="star-outline" 
                    color={iconColor("mood")}
                    onPress={() => navigation.navigate("MoodInput")} 
                />
                <NavIcon 
                    name="bookmark-outline" 
                    color={iconColor("favourites")}
                    ref={favouriteRef}
                />
                <NavIcon 
                    name="account-outline" 
                    color={iconColor("profile")}
                />
                <NavIcon 
                    name="cog-outline" 
                    color={iconColor("Ssettings")}
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
        alignItems: "center"
    },

    navBar: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 28,
        borderWidth: 2,
        borderColor: "#eee",
        paddingHorizontal: 16,
        paddingVertical: 10
    },

    navIcon: {
        paddingHorizontal: 10
    }
});