import { View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WelcomeScreen({ navigation}) {

    return (
        <View style={styles.container}>

            {/* TOP CONTENT */}
            <View style={styles.topContent}>

                {/* gradient logo */}
                <LinearGradient
                    colors={['#ae64e7', '#7b6cff', '#196fca']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.logoCircle}
                >
                    <MaterialCommunityIcons name="brain" size={70} color="#fff" />
                </LinearGradient>

                {/* App Name */}
                <Text style={styles.title}>MoodSync</Text>
                <Text style={styles.subtitle}>
                    Context-Aware AI Activity Recommendations
                </Text>

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        Let MoodSync help you discover the perfect activity based on your current mood, energy level and environment.
                    </Text>
                </View>

                {/* Feature Icons */}
                <View style={styles.features}>
                    <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="brain" size={65} color="#b36bff" />
                        <Text style={styles.featureText}>Mood Detection</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="pulse" size={65} color="#4da6ff" />
                        <Text style={styles.featureText}>Smart Suggestions</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <AntDesign name="bar-chart" size={65} color="#ff6b6b" />
                        <Text style={styles.featureText}>Track Progress</Text>
                    </View>
                </View>     
            </View>

            {/* BOTTOM CONTENT */}
            <View style={styles.bottomContent}>
                <TouchableOpacity onPress={() => navigation.navigate("Privacy")}>
                    <LinearGradient
                        colors={["#b36bff", "#ff4fa3"]}
                        style={styles.primaryButton}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.secondaryButton}
                    onPress={async () => {
                        const user = { name: "Guest User" };
                        await AsyncStorage.setItem("user", JSON.stringify(user));
                        await AsyncStorage.setItem("isLoggedIn", "true");
                        navigation.replace("Home");
                        
                    }}
                >
                    <Text style={styles.secondaryButtonText}>View Dashboard</Text>
                </TouchableOpacity>

                {/* FOOTER */}
                <Text style={styles.footerText}>
                    Your mood and activity data is stored locally and handled with care.
                </Text>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 20
    },
    
    topContent: {
        alignItems: "center",
        marginTop: 70
    },

    bottomContent: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: 'center',
        marginBottom: 30
    },

    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },

    title: {
        fontSize: 40,
        fontWeight: "700",
        color: "#c44ac0",
        letterSpacing: 0.5
    },

    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 10,
        letterSpacing: 0.5
    },

    infoBox: {
        backgroundColor: '#f8fdff',
        borderWidth: 1,
        borderColor: "#d7bde1",
        borderRadius: 14,
        padding: 20,
        marginTop: 30
    },

    infoText: {
        fontSize: 23,
        color: "#949494",
        textAlign: "center",
        lineHeight: 30
    },

    features: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 46,
        width: "100%"
    },

    featureItem: {
        alignItems: "center",
        width: "34%"
    },

    featureText: {
        fontSize: 14,
        color: "#666",
        marginTop: 10,
        textAlign: "center"
    },

    primaryButton: {
        width: 360,
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: "center",
        marginBottom: 14
    },

    primaryButtonText: {
        color: "#fff",
        fontSize: 25,
        fontWeight: "700"
    },

    secondaryButton: {
        width: 360,
        paddingVertical: 14,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#ddd",
        alignItems: "center",
        marginBottom: 18
    },

    secondaryButtonText: {
        fontSize: 20,
        fontWeight: "600",
        color: "#555"
    },

    footerText: {
        fontSize: 16,
        color: "#999",
        textAlign: "center",
        marginTop: 25
    
    }
});