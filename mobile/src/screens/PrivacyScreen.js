import { View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';  
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PrivacyScreen({ navigation }) {
    const [showModal, setShowModal] = useState(false);
    
    const [checks, setChecks] = useState({
        local: false,
        anonymous: false,
        delete: false,
        gdpr: false,
        sensitive: false
    });

    const allChecked = Object.values(checks).every(Boolean);

    const toggle = (key) =>
        setChecks((prev) => ({ ...prev, [key]: !prev[key] }));

    const handleAccept = async () => {
        await AsyncStorage.setItem("userConsent", "true");
        navigation.navigate("AuthChoice");
    };

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >

                {/* TITLE */}
                <View style={styles.rowCenter}>
                    <MaterialCommunityIcons name="shield-lock" size={50} color="#7e27c0" />
                    <Text style={styles.title}>Welcome to MoodSync</Text>
                </View>

                <Text style={styles.subtitle}>Privacy & Data Consent</Text>

                <Text style={styles.paragraph}>
                    MoodSync is designed with your privacy in mind. 
                    We only collect the minimal data necessary to provide personalised activity recommendations. 
                    Please review our data policy.
                </Text>

                {/* DATA SECTION */}
                <Text style={styles.sectionTitle}>What Data We Collect</Text>

                <View style={styles.row}>
                    <Ionicons name="eye-outline" size={30} color="#3061E6" />
                    <Text style={styles.bold}> Mood & Context Information</Text>
                </View>
                <Text style={styles.paragraph}>
                    Your energy level, mood states, time of day and local weather conditions.
                </Text>

                <View style={styles.row}>
                    <MaterialCommunityIcons name="file-chart-outline" size={30} color="#AC54F0" />
                    <Text style={styles.bold}> Activity Feedback</Text>
                </View>
                <Text style={styles.paragraph}>
                    Your ratings and completion status to improve recommendation accuracy over time.
                </Text>

                <Text style={styles.sectionTitle}>How We Use It</Text>
                <Text style={styles.bullet}>• To generate personalised activity recommendations</Text>
                <Text style={styles.bullet}>• To improve the AI model based on user feedback</Text>

                {/* COMMITMENTS */}
                <Text style={styles.sectionTitle}>Our Commitments</Text>
                {[
                    ['local', 'All mood and activity is stored locally and encrypted on your device'],
                    ['anonymous', 'Your ratings are used anonymously to improve recommendations'],
                    ['delete', 'You can delete your data at any time through Settings'],
                    ['gdpr', 'GDPR & data protection compliant'],
                    ['sensitive', 'No sensitive personal data collected'],
                ].map(([key, label]) => (
                    <TouchableOpacity
                        key={key}
                        style={styles.checkRow}
                        onPress={() => toggle(key)}
                    >
                        <MaterialCommunityIcons
                            name={checks[key] ? "checkbox-marked" : "checkbox-blank-outline"}
                            size={20}
                            color={checks[key] ? "#3cb371" : "#aaa"}
                        />
                        <Text style={styles.checkText}>{label}</Text>
                    </TouchableOpacity>
                ))}

                <Text style={styles.sectionTitle}>Purpose</Text>
                <Text style={[styles.paragraph, styles.sectionParagraph]}>
                    The aim of MoodSync is to match users to activity suggestions that align with your current mood and context (time of day, weather).
                    This aims to reduce decision fatigue and improve your wellbeing.
                </Text>

                {/* NOTICE */}
                <Text style={styles.sectionTitle}>Important Notice</Text>
                <Text style={[styles.paragraph, styles.sectionParagraph]}>
                    MoodSync is not designed for mental health diagnosis or crisis intervention.
                    If you are experiencing mental health difficulties, please consult a healthcare professional.
                </Text>

                {/* ACTION BUTTONS */}
                <View style={styles.buttonRow}>

                    <TouchableOpacity 
                        disabled={!allChecked}
                        activeOpacity={0.8}
                        onPress={handleAccept}
                        style={{ opacity: allChecked ? 1 : 0.45 }}
                    >
                        <LinearGradient
                            colors={["#b36bff", "#ff4fa3"]}
                            start={[0, 0]}
                            end={[1, 1]}
                            style={styles.acceptButton}
                        >
                            <Text style={styles.acceptText}>I Accept</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.declineButton}
                        onPress={() => setShowModal(true)}
                    >
                        <Text style={styles.declineText}>Decline</Text>
                    </TouchableOpacity>
                </View>

                {/* FOOTER */}
                <Text style={styles.footerText}>
                    By accepting, you agree to our data handling practices as described above.
                </Text>
            </ScrollView>   

            {/* DECLINE MODAL */}
            <Modal
                transparent
                visible={showModal}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>

                        <View style={styles.modalHeader}>
                            <View style={styles.warningIcon}>
                                <MaterialCommunityIcons 
                                    name="alert-circle-outline" 
                                    size={40} 
                                    color="#ff4d4d" 
                                />
                            </View>  
                            <Text style={styles.modalTitle}>Consent Required</Text> 
                        </View>
                        

                        <Text style={styles.modalText}>
                            MoodSync requires your consent to store mood and activity data locally in order to provide personalised recommendations.
                            Without this consent, we cannot offer our services.
                        </Text>

                        <View style={styles.rememberBox}>
                            <Text style={styles.modalSubTitle}>Remember:</Text>
                            <Text style={styles.modalBullet}>• All data stays on your device</Text>
                            <Text style={styles.modalBullet}>• No personal information collected</Text>
                            <Text style={styles.modalBullet}>• You can clear data anytime</Text>
                        </View>
                        
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={styles.modalButtonText}>
                                Review Privacy Policy Again
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>   
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f8ff',
        paddingTop: 35
    },

    content: {
        padding: 20,
        paddingBottom: 20
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 3,
        marginBottom: 3
    },

    rowCenter: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16
    },

    title: {
        fontSize: 26,
        fontWeight: "700"
    },

    subtitle: {
        fontSize: 22,
        fontWeight: "600",
        color: "#636bff",
        marginBottom: 8
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 10,
        marginBottom: 4
    },

    paragraph: {
        fontSize: 15,
        color: "#555",
        lineHeight: 22,
        marginBottom: 8
    },

    sectionParagraph: {
        marginTop: 5,
        marginBottom: 10
    },

    bold: {
        fontSize: 16,
        fontWeight: "500"
    },

    bullet: {
        fontSize: 15,
        color: "#555",
        marginBottom: 6,
        marginTop: 2
    },

    checkRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 6
    },

    checkText: {
        fontSize: 14,
        marginLeft: 6,
        color: "#444",
        flex: 1
    },

    buttonRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 16,
        paddingVerical: 24
    },

    acceptButton: {
        paddingVertical: 14,
        borderRadius: 12,
        width: 160,
        alignItems: 'center'
    },

    acceptText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16
    },

    declineButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        paddingVertical: 14,
        borderRadius: 12,
        width: 160,
        alignItems: 'center'
    },

    declineText: {
        fontWeight: '600',
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
    },

    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '85%'
    },

    modalHeader: {
        alignItems: 'center',
        marginBottom: 12
    },

    warningIcon: {
        width: 60,
        height: 60,
        borderRadius: 50,
        backgroundColor: "#ffdab9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 10
    },

    modalText: {
        fontSize: 16,
        color: "#555",
        lineHeight: 22,
        marginBottom: 12
    },

    modalSubTitle: {
        fontWeight: "600",
        marginTop: 6,
        fontSize: 18,
        marginBottom: 5
    },

    modalBullet: {
        fontSize: 16,
        color: "#444",
        marginTop: 4,
        lineHeight: 20
    },

    rememberBox: {
        backgroundColor: "#eaf2ff",
        borderColor: "#8fb3ff",
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginTop:  8
    },

    modalButton: {
        marginTop: 18,
        backgroundColor: '#8fb3ff',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center'
    },

    modalButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16
    },

    footerText: {
        fontSize: 11,
        color: "#999",
        textAlign: "center",
        marginTop: 24
    }
});