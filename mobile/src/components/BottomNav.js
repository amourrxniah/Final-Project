import { View, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function BottomNav({ navigation, active }) {
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

function NavIcon ({ name, color, onPress }) {
    return (
        <TouchableOpacity style={styles.navIcon} onPress={onPress}>
            <MaterialCommunityIcons name={name} size={45} color={color}/>
        </TouchableOpacity>
    );
}

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