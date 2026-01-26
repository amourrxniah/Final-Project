import { 
    View, Text, StyleSheet, TouchableOpacity, 
    ActivityIndicator 
} from "react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import AIAssistant from "../components/AIAssistant/AIAssistant";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL = "https://hatable-dana-divertedly.ngrok-free.dev";

const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function DetectedContextScreen({ navigation }) {
    const [mood, setMood] = useState(null);
    const [moodTime, setMoodTime] = useState(null);
    const [timeOfDay, setTimeOfDay] = useState("");
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        loadMood();
        detectTime();
        detectContext();
    }, []);

    const loadMood = async () => {
        const storedMood = await AsyncStorage.getItem("currentMood");
        setMood(storedMood);

        setMoodTime(new Date().toISOString());
    };

    /* TIME OF DAY */
    const detectTime = () => {
        const hour = new Date().getHours();
        if (hour < 12) setTimeOfDay("Morning");
        else if (hour < 18) setTimeOfDay("Afternoon");
        else setTimeOfDay("Evening");
    };

    /* LOCATION + WEATHER */
    const detectContext = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            const url = `${BACKEND_URL}/context?lat=${latitude}&lon=${longitude}`;
            const res = await fetch(url);

            const data = await res.json();
            setWeather(data.weather);
        } catch {

        } finally {
            setTimeout(() => setLoading(false), 600);
        }
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#b36bff" />
                <Text style={styles.loaderText}>
                    Detecting your context...
                </Text>
            </View>
        );
    }

    const getTimeConfig = () => {
        if (timeOfDay === "Morning") {
            return {
                icon: "weather-sunset-up",
                colors: ["#ffe29f", "#ffa99f"]
            };
        }
        if (timeOfDay === "Afternoon") {
            return {
                icon: "weather-sunny",
                colors: ["#ffd194", "#ff6a88"]
            };
        }
        return {
            icon: "weather-night",
            colors: ["#667eea", "#764ba2"]
        };
    }

    const getWeatherConfig = () => {
        if (!weather || !weather.condition) return null; 

        const condition = weather.condition.toLowerCase();

        if (condition.includes("rain")) {
            return {
                icon: "weather-rainy",
                colors: ["#897f7e", "#66a6ff"]
            };
        }

        if (condition.includes("cloud")) {
            return {
                icon: "weather-cloudy",
                colors: ["#d7d2cc", "#304352"]
            };
        }

        if (condition.includes("sun") || condition.includes("clear")) {
            return {
                icon: "weather-sunny",
                colors: ["#fee140", "#fa709a"]
            };
        }

        return {
            icon: "weather-partly-cloudy",
            colors: ["#e0c3fc", "#8ec5fc"]
            };
    }

    const timeConfig = getTimeConfig();
    const weatherConfig = getWeatherConfig();

    const aiContext = {
        timeOfDay,
        weather: weather
            ? `${weather.condition}, ${weather.temperature}°C`
            : "unknown"
    };

    return (
        <View style={styles.container}>

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.back}
                >
                    <MaterialCommunityIcons name="arrow-left" size={30}></MaterialCommunityIcons>
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <MaskedView
                        maskElement={<Text style={styles.title}>Detected Context</Text>}
                    >
                        <LinearGradient
                            colors={["#b36bff", "#ff4fa3"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={[styles.title, { opacity: 0 }]}>
                                Detected Context
                            </Text>
                        </LinearGradient>
                    </MaskedView>

                    <Text style={styles.subtitle}>
                        We found your current setting details
                    </Text>
                </View>
            </View>

            {/* CONTEXT CARDS */}
            <View style={styles.cardsContainer}>

                {/* TIME OF DAY */}
                <LinearGradient
                    colors={timeConfig.colors}
                    style={styles.gradientCard}
                >
                    <MaterialCommunityIcons 
                        name={timeConfig.icon} 
                        size={60} 
                        color="#fff" 
                    />
                    <View>
                        <Text style={styles.cardLabel}>Time of Day</Text>
                        <Text style={styles.cardValue}>{timeOfDay}</Text>
                    </View>
                </LinearGradient>

                {/* WEATHER*/}
                {weatherConfig && (
                    <LinearGradient
                        colors={weatherConfig.colors}
                        style={styles.gradientCard}
                    >
                        <MaterialCommunityIcons 
                            name={weatherConfig.icon}
                            size={60} 
                            color="#fff" 
                        />
                        <View>
                            <Text style={styles.cardLabel}>Weather</Text>
                            <Text style={styles.cardValue}>
                                {capitalize(weather.condition)} • {weather.temperature}°C
                            </Text>
                        </View>
                    </LinearGradient>
                )}
            </View>
 
            {/* CONTINUE BUTTON */}
            <TouchableOpacity
                onPress={() => navigation.navigate("Overview", {
                    mood,
                    moodTime,
                    timeOfDay,
                    weather: weather
                        ? {
                            condition: weather.condition,
                            temperature: weather.temperature
                        }
                        : null
                })}
            >
                <LinearGradient
                    colors={["#b36bff", "#ff4fa3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.continueBtn}
                >
                    <Text style={styles.continueText}>
                        Get activity recommendations
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* AI ASSISTANT */}
            <AIAssistant
                mood="context"
                context={aiContext}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#f0f8ff"
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 60,
        marginBottom: 20
    },

    back: {
        width: 40
    },
    
    headerCenter: {
        flex: 1,
        alignItems: "center",
        marginRight: 10
    },

    title: {
        fontSize: 30,
        fontWeight: "700",
        marginTop: 6
    },

    subtitle: {
        fontSize: 17,
        color: "#666",
        marginTop: 6,
        marginRight: 10
    },
    
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },

    loaderText: {
        marginTop: 12,
        fontSize: 16,
        color: "#555"
    },

    cardsContainer: {
        marginTop: 40,
        marginBottom: 40
    },

    gradientCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 24,
        paddingHorizontal: 30,
        paddingVertical: 38,
        minHeight: 150,
        borderRadius: 26,
        marginBottom: 22
    },

    cardLabel: {
        fontSize: 26,
        color: "rgba(255,255,255,0.85)"
    },

    cardValue: {
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        marginTop: 4
    },

    continueBtn: { 
        paddingVertical: 14,
        borderRadius: 18,
        alignItems: "center",
        marginTop: 90
    },

    continueText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 19
    }
})