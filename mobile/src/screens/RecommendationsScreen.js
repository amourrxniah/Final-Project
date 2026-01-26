import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

import AIAssistant from "../components/AIAssistant/AIAssistant";
import BottomNav from "../components/BottomNav";

const BACKEND_URL = "https://hatable-dana-divertedly.ngrok-free.dev";

export default function RecommendationsScreen({ route, navigation }) {
    const { mood, weather } = route.params;

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;

            const { coords } = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = coords;
            const res = await fetch(
                `${BACKEND_URL}/recommendations?mood=${mood}&weather=${weather?.condition}&lat=${latitude}&lon=${longitude}`
            );

            const data = await res.json();
            setActivities(data.slice(0, 4));
        } catch (err) {
            console.log("Recommendation error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
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
                            maskElement={<Text style={styles.title}>Your Recommendations</Text>}
                        >
                            <LinearGradient
                                colors={["#b36bff", "#ff4fa3"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={[styles.title, { opacity: 0 }]}>
                                    Your Recommendations
                                </Text>
                            </LinearGradient>
                        </MaskedView>
                    </View>
                </View>

                {/* INFO */}
                <View style={styles.infoPill}>
                    <Text style={styles.infoText}>
                        We've found {activities.length} activities that match you perfectly.
                        Each recommendation is tailored to your mood, environment and wellbeing.
                    </Text>
                </View>

                {loading && <ActivityIndicator size="large" />}

                {/* ACTIVITY CARDS */}
                {activities.map((item, index) => (
                    <View key={item.id} style={styles.card}>
                        {/* RANK */}
                        <View style={styles.rankCircle}>
                            <Text style={styles.rankText}>{index + 1}</Text>
                        </View>

                        {/* ICON */}
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons
                                name="star-outline"
                                size={26}
                                color="#6b5cff"
                            />
                        </View>

                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.desc}>{item.description}</Text>

                        <View style={styles.metaRow}>
                            <Text style={styles.meta}>📍 {item.distance} miles</Text>
                            <Text style={styles.tag}>
                                <Text style={styles.tagText}>{item.tag}</Text>
                            </Text>
                        </View>

                        <View style={styles.feedback}>
                            <TouchableOpacity style={styles.feedbackBtn}>
                                <MaterialCommunityIcons name="thumb-uo-outline" size={20} />
                            </TouchableOpacity>
                            <Text>Helpful</Text>
                            <Text>Not Helpful</Text>
                        </View>


                    </View>
                ))}
            </ScrollView>
            <View style={styles.content}>
         
                <BottomNav navigation={navigation} active="mood" />
            </View>
        </View>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f8ff"
    },

    content:  {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 24,
    },

    scrollArea: {
        flex: 1
    },

    scrollContent: {
        paddingBottom: 20
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 60,
        marginBottom: 20,
        position: "relative"
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
    }
})
