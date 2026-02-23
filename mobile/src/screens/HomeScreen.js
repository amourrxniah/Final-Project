import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, useRef } from "react";
import { Animated } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Rect, Text as SvgText, Path, Circle } from "react-native-svg";
import BottomNav from "../components/BottomNav";
import axios from "axios";

const BACKEND_URL = "https://hatable-dana-divertedly.ngrok-free.dev";

export default function HomeScreen({ navigation }) {
    const [name, setName] = useState("User");

    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem("token");

                if (!token) return;

                const res = await axios.get(`${BACKEND_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setName(res.data.username || res.data.name || "User");
            } catch (err) {
                console.log("User load failed", err);
                setName("User");
            }
        };
        loadUser();
    }, []);

    return (
        <View style={styles.container}>

            {/* MAIN CONTENT */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* HEADER */}
                <View style={styles.headerRow}>
                    <View style={styles.profileIcon}>
                        <MaterialCommunityIcons name="account-outline" size={50} color="#fff" ></MaterialCommunityIcons>
                    </View>
                    <View>
                        <Text style={styles.welcome}>Welcome Back</Text>
                        <Text style={styles.name}>{name}</Text>
                    </View>
                </View>
                
                {/* READY CARD */}
                <LinearGradient colors={["#b36bff", "#ff4fa3"]} style={styles.readyCard}>
                    <View style={styles.readyHeader}>
                        <MaterialCommunityIcons 
                            name="star-four-points" 
                            size={34} 
                            color="#fff"
                        />
                        <Text style={styles.readyTitle}>Ready for your next activity </Text>
                    </View>

                    <Text style={styles.readyDescription}>
                        Log your current mood and we'll find the perfect activity for you
                    </Text>

                    <TouchableOpacity style={styles.moodButton} onPress={() => navigation.navigate("MoodInput")}>
                        <Text style={styles.moodButtonText}>Start Mood Log</Text>
                    </TouchableOpacity>
                </LinearGradient>
                
                {/* STATS */}
                <View style={styles.statsRow}>
                    <StatCard icon="pulse" label="Total Syncs" color="#9b5de5" />
                    <StatCard icon="trending-up" label="Day Streak" color="#2ec4b6" />
                    <StatCard icon="battery-low" label="Most Common" color="#4dabf7" />
                </View>

                {/* 7 DAY MOOD TREND */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons
                            name="trending-up"
                            size={35}
                            color="#ba55d3"
                        />
                        <Text style={styles.cardTitle}>7 Day Mood Trend</Text>
                    </View>

                    <MoodFrequencyGraph
                        data={[
                            { day: "Mon", value: 0},
                            { day: "Tue", value: 1},
                            { day: "Wed", value: 0},
                            { day: "Thu", value: 2},
                            { day: "Fri", value: 1},
                            { day: "Sat", value: 0},
                            { day: "Sun", value: 0}
                        ]}
                    />

                    {/* LEGEND */}
                    <View style={styles.legendRow}>
                        <Legend color="#4dabf7" label="Low" />
                        <Legend color="#9b5de5" label="Neutral" />
                        <Legend color="#ff4fa3" label="High" />
                    </View>
                </View>

                {/* RECENT ACTIVITY */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons 
                            name="calendar-blank-outline" 
                            size={35} 
                            color="#9b5de5"
                        />
                        <Text style={styles.cardTitle}>Recent Activity</Text>
                    </View>

                    <ActivityRow title="Low Energy" sub="9:41 PM" tag="Evening" tagStyle={styles.tagNeutral} topBorder />
                    <ActivityRow title="Coffee & Co" sub="2 days ago" tag="Enjoyed" tagStyle={styles.tagSuccess} />
                    <ActivityRow title="Cinema - Latest Releases" sub="1 week ago" tag="Skipped" tagStyle={styles.tagDanger} />
                </View>
                
                {/* INSIGHTS */}
                <View style={[styles.card, styles.insightsCard]}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="lightbulb-on-outline" size={35} color="#f4c430"/>
                        <Text style={styles.cardTitle}>Insights</Text>
                    </View>

                    <View style={styles.insightRow}>
                        <MaterialCommunityIcons name="fire" size={30} color="#ff6b35"/>
                        <Text style={styles.insightText}>
                            You're on a 1-day streak! Keep it up!
                        </Text>
                    </View>

                    <View style={styles.insightRow}>
                        <MaterialCommunityIcons name="flare" size={30} color="#dc143c"/>
                        <Text style={styles.insightText}>
                            Keep logging your mood to unlock personalised insights
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <BottomNav navigation={navigation} active="home" />
        </View>
    );
}
    function StatCard({ icon, label, color, value = "0" }) {
    return (
        <View style={styles.statCard}>
            <MaterialCommunityIcons 
                name={icon}
                size={32} 
                color={color}/> 
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}


function Legend ({ color, label }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
        </View>
    );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function MoodFrequencyGraph({ data }) {
    const maxValue = 3;
    const chartWidth = 320;
    const chartHeight = 190;
    const padding = 36;

    const stepX = (chartWidth - padding * 2) / (data.length - 1);
    const stepY = (chartHeight - padding * 2) / maxValue;

    //animation values
    const anim = useRef(data.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        Animated.stagger(
            120,
            anim.map(a =>
                Animated.spring(a, {
                    toValue: 1,
                    useNativeDriver: true
                })
            )
        ).start();
    }, []);

    const getColor = value => {
        if (value === 0) return "#4dabf7"; //low
        if (value === 1) return "#9b5de5"; //neutral
        return "#ff4fa3"; //high
    };

    const points = data.map((item, index) => {
        const x = padding + index * stepX;
        const y = chartHeight - padding - item.value * stepY;
        return { x, y, value: item.value};
    });

    const linePath = points
        .map((p, i) =>`${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
        .join(" ");

    return (
        <View style={{ alignItems: "center" }}>
            <Svg width={chartWidth} height={chartHeight}>

                {/* Y AXIS */}
                {[0, 1, 2, 3].map(v => (
                    <SvgText
                        key={v}
                        x={8}
                        y={chartHeight - padding - v * stepY + 4}
                        fontSize="12"
                        fill="#888" 
                    >
                        {v}
                    </SvgText>
                ))}

                {/* GRID */}
                {[0, 1, 2, 3].map(v => (
                    <Rect
                        key={v}
                        x={padding}
                        y={chartHeight - padding - v * stepY}
                        width={chartWidth - padding * 2}
                        height="1"
                        fill="#eaeaea" 
                    /> 
                ))}

                {/* SMOOTH LINE */}
                <Path
                    d={linePath}
                    fill="none"
                    stroke="#9b5de5"
                    strokeWidth={4}
                    strokeLinecap="round"
                />

                {/* DOTS */}
                {points.map((p, index) => (
                    <AnimatedCircle
                        key={index}
                        cx={p.x}
                        cy={p.y}
                        r={6}
                        fill={getColor(p.value)}
                        style={{
                            opacity: anim[index],
                            transform: [{ scale: anim[index] }]
                        }}
                    />

                ))}

                {/* X AXIS */}
                {data.map((item, index) => (
                    <SvgText
                        key={item.day}
                        x={padding + index * stepX}
                        y={chartHeight - 6}
                        fontSize="12"
                        fill="#666"
                        textAnchor="middle"
                    >
                        {item.day}
                    </SvgText>
                ))}
            </Svg>
        </View>
    );
}

function ActivityRow({ title, sub, tag, tagStyle, topBorder = true }) {
    return (
        <View style={[
            styles.activityRow, 
            topBorder && { borderTopWidth: 2 },
            !topBorder && { borderTopWidth: 0 }
        ]}>
            <View style={styles.activityLeft}>
                <Text style={styles.activityTitle}>{title}</Text>
                <Text style={styles.activitySub}>{sub}</Text>
            </View>
            <View style={tagStyle}>
                <Text style={styles.tagText}>{tag}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f8ff"
    },

    content: {
        padding: 20,
        paddingBottom: 80,
        marginTop: 23
    },

    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        fontSize: 22,
        fontWeight: "500"
    },
    
    profileIcon: {
        width: 70,
        height: 70,
        borderRadius: 50,
        backgroundColor: "#c77dff",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        marginTop: 15
    },

    welcome: {
        fontSize: 26,
        color: "#666",
        marginTop: 20
    },

    name: {
        fontSize: 23,
        fontWeight: "600"
    },

    readyCard: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        marginTop: 5,
        paddingBottom: 20
    },

    readyHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12
    },

    readyTitle: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 21,
        marginLeft: 10
    },

    readyDescription: {
        color: "#f5f5f5",
        fontSize: 18,
        lineHeight: 20,
        textAlign: "center",
        marginBottom: 10
    },

    moodButton: {
        backgroundColor: "#fff",
        borderRadius: 22,
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 12
    },

    moodButtonText: {
        fontSize: 18,
        color: "#c77dff",
        fontWeight: "600"
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 25
    },

    statCard: {
        width: "31%",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        padding: 12,
        backgroundColor: "#fff"
    },

    statValue: {
        fontSize: 22,
        fontWeight: "700",
        marginTop: 8
    },

    statLabel: {
        fontSize: 12.5,
        fontWeight: "500",
        marginTop: 3
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 16,
        marginBottom: 22
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14
    },

    cardTitle: {
        fontSize: 21,
        fontWeight: "600",
        marginLeft: 8
    },

    legendRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 14
    },

    legendItem: {
        flexDirection: "row",
        alignItems: "center"
    },

    legendDot: {
        width: 15,
        height: 15,
        borderRadius: 5,
        marginRight: 6
    },

    legendText: {
        fontSize: 14,
        color: "#666"
    },

    activityRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderColor: "#f0f0f0"
    },

    activityLeft: {
        flex: 1
    },

    activityTitle: {
        fontSize: 17,
        fontWeight: "500"
    },

    activitySub: {
        fontSize: 14,
        color: "#888"
    },

    tagNeutral: {
        backgroundColor: "#ede9fe",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999
    },

    tagSuccess: {
        backgroundColor: "#d1fae5",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999
    },

    tagDanger: {
        backgroundColor: "#fee2e2",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999
    },

    tagText: {
        fontSize: 16,
        fontWeight: "600"
    },

    insightsCard: {
        backgroundColor: "#f1ecff"
    },

    insightRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10
    },

    insightText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: "600",
        color: "#6a5acd",
        flex: 1
    }
})