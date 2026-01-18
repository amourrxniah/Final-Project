import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';  
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import MaskedView from "@react-native-masked-view/masked-view";
import { useState } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ManualSignupScreen({ navigation }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(null);

    /* validation */ 
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const rules = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
    };

    const allValid = 
        name.length > 1 &&
        emailValid && 
        Object.values(rules).every(Boolean);

    const handleSignup = async () => {
        const userData = {
            name,
            email
        };

        await AsyncStorage.setItem("user", JSON.stringify(userData));
        await AsyncStorage.setItem("isLoggedIn", "true");
        
        navigation.replace("Home");
    };

    return (
        <View style={styles.container}>

            {/* BACK */}
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.back}>
                <MaterialCommunityIcons name="arrow-left" size={30}></MaterialCommunityIcons>
            </TouchableOpacity>

            {/* CONTENT */}
            <View style={styles.content}>

                {/* GRADIENT TITLE */}
                <MaskedView 
                    maskElement={
                        <Text style={styles.title}>Create Your Account</Text>
                    }
                >
                    <LinearGradient
                        colors={["#b36bff", "#ff4fa3"]}
                        start={[0, 0]}
                        end={[1, 1]}
                    >
                        <Text style={[styles.title, { opacity: 0 }]}>Create Your Account</Text>
                    </LinearGradient>
                </MaskedView>
                

                <Text style={styles.subtitle}>
                    Enter your details to get started
                </Text>

                {/* FULL NAME */}
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocused("name")}
                    onBlur={() => setFocused(null)}
                    style={[
                        styles.input,
                        focused === "name" && styles.focusedInput
                ]}
                ></TextInput>

                {/* EMAIL */}
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    placeholder="example@email.com"
                    value={email}
                    autoCapitalize="none"
                    onChangeText={setEmail}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    style={[
                        styles.input,
                        focused === "email" && styles.focusedInput,
                        email.length > 0 && emailValid && styles.validInput
                ]}
                ></TextInput>

                {/* PASSWORD */}
                <Text style={styles.label}>Password</Text>

                <View style={styles.passwordWrapper}>

                    {/* PASSWORD RULES BUBBLE */}
                    {(focused === "password" || password.length > 0) && (
                        <View style={styles.rulesBubbleRight}>
                            <View style={styles.triangleRight} />
                            <Rule text="8+ characters" valid={rules.length}/>
                            <Rule text="One uppercase letter" valid={rules.uppercase}/>
                            <Rule text="One number" valid={rules.number}/>
                        </View>
                    )}

                    {/* PASSWORD INPUT */}
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            placeholder="Password"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => setFocused("password")}
                            onBlur={() => setFocused(null)}
                            style={[
                                styles.input,
                                styles.passwordInput,
                                focused === "password" && styles.focusedInput
                            ]}
                        />

                        {/* TOGGLE EYE */}
                        <TouchableOpacity
                            style={styles.eye}
                            onPress={() => setShowPassword(prev => !prev)}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off": "eye"}
                                size={22}
                                color="#666"
                            >
                            </Ionicons>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* CREATE ACCOUNT BUTTON */}
                <TouchableOpacity 
                    disabled={!allValid} 
                    onPress={handleSignup}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={["#b36bff", "#ff4fa3"]}
                        start={[0, 0]}
                        end={[1, 1]}
                        style={[
                            styles.button,
                            !allValid && styles.disabledButton
                        ]}
                    >
                        <Text style={styles.buttonText}>
                            Create Account
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function Rule({ text, valid }){
    return (
        <View style={styles.ruleRow}>
            <MaterialCommunityIcons
                name={valid ? "check-circle": "close-circle"}
                color={valid ? "green" : "ccc"}
                size={18}
            />
            <Text style={styles.ruleText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: "#f0f8ff"
    },

    back: {
        marginTop: 70,
    },

    content: {
        marginTop: 20
    },

    title: {
        fontSize: 32,
        fontWeight: "700",
        textAlign: "center",
    },

    subtitle: {
        textAlign: "center",
        color: "#666",
        marginVertical: 16,
        fontSize: 18
    },

    label: {
        marginBottom: 6,
        fontWeight: "600",
        color: "#333",
        fontSize: 16
    },

    input: {
        backgroundColor: "#fff",
        borderRadius: 14,
        padding: 16,
        fontSize: 18,
        marginBottom: 18,
        borderColor: "#ccc",
        borderWidth: 1.5
    },

    focusedInput: {
        borderColor: "#4c8dff",
        borderWidth: 2
    },

    validInput: {
        borderColor: "#2ecc71",
        borderWidth: 2
    },

    passwordWrapper: {
        position: "relative",
        marginBottom: 16
    },

    passwordInputContainer: {
        position: "relative"
    },

    passwordInput: {
        paddingRight: 50,
        marginBottom: 0
    },

    eye: {
        position: "absolute",
        right: 16,
        top: 18
    },

    rulesBubbleRight: {
        position: "absolute",
        left: "45%",
        bottom: 65,
        width: 190,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        zIndex: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 }
    },

    triangleRight: {
        position: "absolute",
        bottom: -8,
        right: 30,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "#fff"
    },

    rules: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "ddd"
    },

    ruleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6
    },

    ruleText: {
        marginLeft: 6,
        fontSize: 14
    },

    button: {
        paddingVertical: 16,
        borderRadius: 999,
        alignItems: "center",
        marginTop: 10,
    },

    disabledButton: {
        opacity: 0.45
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 17
    }

})