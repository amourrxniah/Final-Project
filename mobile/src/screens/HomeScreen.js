import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen({ navigation }) {
    const [name, setName] = useState("User");

    useEffect(() => {
        const loadUser = async () => {
            const stored = await AsyncStorage.getItem("user");
            if (stored) setName(JSON.parse(stored).name || "User");           
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
                        <Text style={styles.name}>{name || "User"}</Text>
                    </View>
                </View>
                
                {/* ACTIVITY CARD */}
                <LinearGradient
                    colors={["#b36bff", "#ff4fa3"]}
                    style={styles.readyCard}
                >
                    <View style={styles.readyHeader}>
                        <MaterialCommunityIcons 
                            name="star-four-points" 
                            size={34} 
                            color="#fff"
                        />
                        <Text style={styles.readyTitle}>
                            Ready for your next activity
                        </Text>
                    </View>

                    <Text style={styles.readyDescription}>
                        Log your current mood and we'll find the perfect activity for you
                    </Text>

                    <TouchableOpacity style={styles.moodButton}>
                        <Text style={styles.moodButtonText}>Start Mood Log</Text>
                    </TouchableOpacity>
                </LinearGradient>
                
                {/* STATS */}
                <View style={styles.statsRow}>
                    <StatCard icon="pulse" label="Total Syncs" color="#9b5de5" />
                    <StatCard icon="trending-up" label="Day Streak" color="#2ec4b6" />
                    <StatCard icon="battery-low" label="Most Common" color="#4dabf7" />
                </View>

                {/* TREND */}
                <View style={styles.trendHeader}>
                    <MaterialCommunityIcons
                        name="trending-up"
                        size={35}
                        color="#ba55d3"
                    />
                    <Text style={styles.sectionTitle}>7 Day Mood Trend</Text>
                </View>
                
                <View style={styles.moodTable}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                        <View key={day} style={styles.moodCell}>
                            <Text style={styles.moodDot} />
                            <Text style={styles.day}>{day}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.legendRow}>
                    <Legend color="#4dabf7" label="Low" />
                    <Legend color="#9b5de5" label="Neutral" />
                    <Legend color="#ff4fa3" label="High" />
                </View>

                {/* RECENT ACTIVITY */}
                <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons 
                        name="calendar-blank-outline" 
                        size={30} 
                        color="#9b5de5"
                    />
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                </View>

                <View style={styles.activityContainer}>

                    {/* ROW 1 */}
                    <View style={styles.activityRow}>
                        <View style={styles.activityLeft}>
                            <Text style={styles.activityTitle}>Low Energy</Text>
                            <Text style={styles.activitySub}>9:41 PM</Text>
                        </View>

                        <View style={styles.tagNeutral}>
                            <Text style={styles.tagText}>Evening</Text>
                        </View>
                    </View>

                    {/* ROW 2 */}
                    <View style={styles.activityRow}>
                        <View style={styles.activityLeft}>
                            <Text style={styles.activityTitle}>Coffee & Co</Text>
                            <Text style={styles.activitySub}>2 days ago</Text>
                        </View>

                        <View style={styles.tagSuccess}>
                            <Text style={styles.tagText}>Enjoyed</Text>
                        </View>
                    </View>

                    {/* ROW 3 */}
                    <View style={styles.activityRow}>
                        <View style={styles.activityLeft}>
                            <Text style={styles.activityTitle}>Cinema - Latest Releases</Text>
                            <Text style={styles.activitySub}>1 week ago</Text>
                        </View>

                        <View style={styles.tagDanger}>
                            <Text style={styles.tagText}>Skipped</Text>
                        </View>
                    </View>
                </View>


                {/* INSIGHTS */}
                <Text style={styles.sectionTitle}>Insights</Text>
                <View style={styles.insightBox}>
                    <Text style={styles.insightText}>
                        You're on a 1-day streak! Keep it up!
                    </Text>
                    <Text style={styles.insightSub}>
                        Keep loggin your mood to unlock personalised insights
                    </Text>
                </View>

            </ScrollView>

            {/* BOTTOM NAV */}
            <View style={styles.navWrapper}>
                <View style={styles.navBar}>
                    <NavIcon name="home" active />
                    <NavIcon name="star-outline" />
                    <NavIcon name="bookmark-outline" />
                    <NavIcon name="account-outline" />
                    <NavIcon name="cog-outline" />
                </View>       
            </View>

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

function NavIcon ({ name, active }) {
    return (
        <TouchableOpacity style={styles.navIcon}>
            <MaterialCommunityIcons name={name} size={45} color={active ? "#9b5de5" : "#aaa"}/>
        </TouchableOpacity>
    );
}

function Legend ({ color, label }) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: color,
                marginRight: 6
            }} />
            <Text style={{ fontSize: 12, color: "#666" }}>{label}</Text>
        </View>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9ff"
    },

    content: {
        padding: 20,
        paddingBottom: 160,
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
        fontSize: 22,
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
        fontSize: 20,
        marginLeft: 10
    },

    readyDescription: {
        color: "#f5f5f5",
        fontSize: 17,
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

    statBox: {
        width: "30%",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 12
    },

    statCard: {
        width: "31%",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        padding: 12
    },

    statValue: {
        fontSize: 20,
        fontWeight: "700",
        marginTop: 8
    },

    statLabel: {
        fontSize: 12,
        fontWeight: "500"
    },

    statSub: {
        fontSize: 10,
        color: "#888"
    },

    trendHeader: {},

    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 10
    },

    moodTable: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    moodCell: {
        alignItems: "center"
    },

    day: {
        fontSize: 12,
        color: "#666",
        marginBottom: 6
    },

    moodDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#b36bff"
    },

    activityContainer: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        marginBottom: 20
    },

    activityRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignContent: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBlockColor: "#f0f0f0"
    },

    activityLeft: {
        flex: 1,
        marginRight: 10
    },

    activityTitle: {
        fontSize: 14,
        fontWeight: "600"
    },

    activitySub: {
        fontSize: 12,
        color: "#888",
        marginTop: 2
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
        fontSize: 14,
        fontWeight: "600",
        color: "#111"
    },

    insightBox: {
        backgroundColor: "#eae8ff",
        padding: 14,
        borderRadius: 12
    },

    insightText: {
        fontWeight: "600"
    },

    insightSub: {
        fontSize: 12,
        color: "#555",
        marginTop: 4
    },

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
        borderColor: "#e0e0e0",
        paddingHorizontal: 16,
        paddingVertical: 10
    },

    navIcon: {
        paddingHorizontal: 10
    }

})