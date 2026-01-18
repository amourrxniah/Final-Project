import { View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

export default function AuthChoiceScreen({ navigation }) {

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
        webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
        iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
        androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
        scopes: ["profile", "email"],
    });

    useEffect(() => {
        if (response?.type === "success") {
            const saveGoogleUser = async () => {
                const user = {
                    name: ""
                };

                await AsyncStorage.setItem("user", JSON.stringify(user));
                await AsyncStorage.setItem("isLoggedIn", "true");

                navigation.replace("Home");
            }
            
            saveGoogleUser();
        }
    }, [response]);

    const handleLogin = async () => {
        const storedUser = await AsyncStorage.getItem("user");
        const isLoggedIn = await AsyncStorage.getItem("isLoggedIn");

        if (storedUser && isLoggedIn === "true") {
            navigation.replace("Home");
        }
    };

    return (
        <View style={styles.container}>

            {/* MAIN CONTENT */}
            <View style={styles.content}>

                {/* ICON HEADER */}
                <LinearGradient
                    colors={["#b36bff", "#ff4fa3"]}
                    start={[0, 0]}
                    end={[1, 1]}
                    style={styles.iconBackground}
                >
                    <MaterialCommunityIcons name="account-outline" size={65} color="#fff" />
                </LinearGradient>

                <Text style={styles.title}>Create Your Account</Text>
                <Text style={styles.subtitle}>Choose how you'd like to sign in</Text>

                {/* AUTH BUTTONS */}
                <View style={styles.authGroup}>

                    {/* GOOGLE */}
                    <TouchableOpacity 
                        style={styles.googleButton}
                        disabled={!request}
                        onPress={() => promptAsync({ useProxy: true })}
                    >
                        <MaterialCommunityIcons 
                            name="gmail" 
                            size={40} />
                        <Text style={styles.googleText}>Continue with Gmail</Text>
                    </TouchableOpacity>

                    {/* ICLOUD */}
                    {Platform.OS === "ios" && (
                        <TouchableOpacity
                            style={styles.appleButton}
                            onPress={async () => {
                                try {
                                    const credential = await AppleAuthentication.signInAsync({
                                        requestedScopes: [
                                            AppleAuthentication.AppleAuthenticationScope.EMAIL,
                                            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                                        ],
                                    });

                                    const user = {
                                        name: credential.fullName?.givenName ?? "Apple User",
                                    };

                                    await AsyncStorage.setItem("user", JSON.stringify(user));
                                    await AsyncStorage.setItem("isLoggedIn", "true");

                                    navigation.replace("Home");

                                } catch (e) {}
                            }}
                        >
                            <MaterialCommunityIcons 
                                name="apple" 
                                size={40} 
                                color="#ffffff" />
                            <Text style={styles.appleText}>Continue with iCloud</Text>
                        </TouchableOpacity>
                        
                    )}

                    {/* LOGIN EXISTING */}
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                    >
                        <Text style={styles.loginText}>Log in to existing account</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.orRow}> 
                        <View style={styles.orLine}/> 
                        <Text style={styles.orText}>or</Text> 
                        <View style={styles.orLine}/> 
                    </View>


                    {/* MANUAL */}
                    <TouchableOpacity onPress={() => navigation.navigate("ManualSignup")}>
                        <LinearGradient
                            colors={["#b36bff", "#ff4fa3"]}
                            start={[0, 0]}
                            end={[1, 1]}
                            style={styles.manualButton}
                        >
                            <Text style={styles.manualText}>Create Account Manually</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                </View>
            </View>
            {/* FOOTER */}
            <Text style={styles.footer}>
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 20,
        justifyContent: "space-between"
    },

    content: {
        alignItems: "center",
        marginTop: 140
    },

    iconBackground: {
        width: 90,
        height: 90,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 28
    },

    title: {
        fontSize: 30,
        fontWeight: "500",
        marginBottom: 6
    },

    subtitle: {
        fontSize: 18,
        color: "#949494",
        marginBottom: 40,
        textAlign: "center"
    },

    authGroup: {
        width: "100%",
        marginTop: 30
    },

    googleButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 999,
        paddingVertical: 14,
        justifyContent: "center",
        marginBottom: 16,
        backgroundColor: "#fff"
    },

    googleText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111111"
    },

    appleButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderRadius: 999,
        paddingVertical: 14,
        justifyContent: "center",
        marginBottom: 22,
        backgroundColor: "#000"
    },

    appleText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#ffffff"
    },

    loginButton: {
        paddingVertical: 22,
        borderRadius: 999,
        backgroundColor: "#fff",
        borderWidth: 1,
        alignItems: "center",
        marginBottom: 16,
        borderColor: "#ccc"
    },

    loginText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#444"
    },

    orRow: {
       flexDirection: "row",
       alignItems: "center",
       marginBottom: 22
    },

    orLine: {
       flex: 1,
       height: 1,
       backgroundColor: "#ccc",
    },

    orText: {
       marginHorizontal: 10,
       fontSize: 16,
       color: "#666",
    },

    manualButton: {
        paddingVertical: 15,
        borderRadius: 999,
        backgroundColor: "#f2f2f2",
        alignItems: 'center',
        marginTop: 6
    },

    manualText: {
        fontWeight: "600",
        color: "#fff",
        fontSize: 16
    },

    footer: {
        fontSize: 16,
        color: "#999",
        textAlign: "center",
        paddingBottom: 30
    },
});