import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    Platform
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';  
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import MaskedView from "@react-native-masked-view/masked-view";
import { useEffect, useState } from 'react';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { signupManual, checkUsernameAvailability } from "../components/api";
export default function ManualSignupScreen({ navigation }) {
    
    /* -------------------- STATE -------------------- */
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [usernameAvailable, setUsernameAvailable] = useState(null);
    const [email, setEmail] = useState("");
    const [dob, setDob] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);
    
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    const [focused, setFocused] = useState(null);
    const [loading, setLoading] = useState(false);

    /* -------------------- HELPERS -------------------- */
    const calculateAge = (dobStr) => {
        if (!/^\d{2}-\d{2}-\d{4}$/.test(dobStr)) return null;

        const [day, month, year] = dobStr.split("-").map(Number);
        const birth = new Date(year, month - 1, day);
        const today = new Date();

        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();

        if (m < 0 || (m == 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const checkUsername = async (value) => {
        setUsername(value);

        if (value.trim().length < 3) {
            setUsernameAvailable(null);
            return;
        }

        try {
            const available = await checkUsernameAvailability(value.trim());
            setUsernameAvailable(available);
        } catch {
            setUsernameAvailable(null);
        }
    };

    /* -------------------- VALIDATION -------------------- */ 
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const rules = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
    };

    const passwordsMatch = 
        confirmPassword.length > 0 && password === confirmPassword;

    const passwordValid = Object.values(rules).every(Boolean) && passwordsMatch;


    const dobValid = /^\d{2}-\d{2}-\d{4}$/.test(dob);
    const age = calculateAge(dob);
    const ageValid = age !== null && age >= 13;

    const allValid = 
        name.trim().length > 1 &&
        username.trim().length >= 3 &&
        emailValid && 
        passwordValid &&
        passwordsMatch &&
        dobValid &&
        ageValid;

    /* -------------------- HAPTIC FEEDBACK -------------------- */
    useEffect(() => {
        if (passwordsMatch && confirmPassword.length > 0) {
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );
        }
    }, [passwordsMatch]);

    /* -------------------- DOB FORMATTER -------------------- */
    const handleDobChange = (text) => {
        //numbers only
        const cleaned = text.replace(/\D/g, "").slice(0, 8);

        let formatted = cleaned;

        if (cleaned.length > 4) {
            formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2,4)}-${cleaned.slice(4)}`;
        } else if (cleaned.length > 2) {
            formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
        }
        setDob(formatted);
    };

    /* -------------------- DATE PICKER -------------------- */
    const onDatePicked = (_, selectedDate) => {
        setShowDatePicker(false);
        if (!selectedDate) return;

        const day = String(selectedDate.getDate()).padStart(2, "0");
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const year = selectedDate.getFullYear();

        setDob(`${day}-${month}-${year}`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    /* -------------------- SIGNUP -------------------- */
    const handleSignup = async () => {
        if (!allValid || loading) return;

        try {
            setLoading(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const [day, month, year] = dob.split("-");

            await signupManual({
                name: name.trim(),
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                password,
                date_of_birth: `${year}-${month}-${day}`
            });

            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
            );

            navigation.replace("Home");
        } catch (err) {
            Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error
            );

            console.log("Signup error", err.response?.data || err);

            Alert.alert(
                "Signup failed",
                err.response?.data?.detail || "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>

                {/* BACK */}
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.back}>
                    <MaterialCommunityIcons name="arrow-left" size={30}></MaterialCommunityIcons>
                </TouchableOpacity>

                <KeyboardAwareScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                    enableOnAndroid
                    extraScrollHeight={Platform.OS === "ios" ? 30 : 80}
                    showsVerticalScrollIndicator={false}
                >

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

                        {/* USERNAME */}
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            placeholder="Choose a username"
                            value={username}
                            autoCapitalize="none"
                            onChangeText={checkUsername}
                            style={[
                                styles.input,
                                usernameAvailable === true && styles.validInput,
                                usernameAvailable === false && styles.invalidInput
                            ]}
                        ></TextInput>
                        {usernameAvailable === false && (
                            <Text style={styles.errorText}>Username already taken</Text>
                        )}

                        

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

                        {/* DOB */}
                        <Text style={styles.label}>Date of Birth</Text>
                        <View style={{ position: "relative" }}>
                            <TextInput
                                placeholder="DD-MM-YYYY"
                                value={dob}
                                onChangeText={handleDobChange}
                                maxLength={10}
                                keyboardType="number-pad"
                                style={[
                                    styles.input,
                                    dob.length === 10 && dobValid && ageValid && styles.validInput,
                                    dob.length === 10 && dobValid && !ageValid && styles.invalidInput
                                ]}
                            />

                            {/* CALENDAR */}
                            <TouchableOpacity
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setShowDatePicker(true);
                                }}
                                style={styles.calendarIcon}
                            >
                                <Ionicons name="calendar-outline" size={22} color="#666"/>
                            </TouchableOpacity>
                        </View>   
                        {dob.length === 10 && !ageValid && (
                            <Text style={styles.errorText}>
                                You must be at least 13 years old to sign up
                            </Text>
                        )}

                        {showDatePicker && (
                            <DateTimePicker
                                value={new Date(2005, 0, 1)}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                maximumDate={new Date()}
                                onChange={onDatePicked}
                            />
                        )}
                        

                        {/* PASSWORD */}
                        <Text style={styles.label}>Password</Text>

                        <View style={styles.passwordWrapper}>

                            {/* PASSWORD RULES BUBBLE */}
                            {focused === "password" && (
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
                                        focused === "password" && styles.focusedInput,
                                        password.length > 0 && (
                                            passwordValid
                                                ? styles.validInput
                                                : styles.invalidInput
                                        )
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

                        {/* CONFIRM PASSWORD */}
                        <Text style={styles.label}>Confirm Password</Text>
                        <View style={styles.passwordWrapper}>

                            {/* PASSWORD INPUT */}
                            <View style={styles.passwordInputContainer}>

                                {focused === "confirmPassword" && (
                                <View style={styles.rulesBubbleRight}>
                                    <View style={styles.triangleRight} />
                                    <Rule text="Passwords match" valid={passwordsMatch}/>
                                </View>
                            )}
                                <TextInput
                                    placeholder="Confirm Password"
                                    secureTextEntry={!showPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    onFocus={() => setFocused("confirmPassword")}
                                    onBlur={() => setFocused(null)}
                                    style={[
                                        styles.input,
                                        styles.passwordInput,
                                        focused === "confirmPassword" && styles.focusedInput,
                                        confirmPassword.length > 0 && 
                                            (passwordsMatch 
                                                ? styles.validInput
                                                : styles.invalidInput
                                            )
                                    ]}
                                />

                                {confirmPassword.length > 0 && (
                                    <Text
                                        style={{
                                            color: passwordsMatch ? "#2ecc71" : "#e74c3c",
                                            marginBottom: 12
                                        }}
                                    >
                                        {passwordsMatch
                                            ? "Password match ✓"
                                            : "Passwords don't match"}
                                    </Text>
                                )}

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
                            onPress={allValid || loading ? handleSignup : null}
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
                                    {loading ? "Creating account..." : "Create Account"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAwareScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
}

function Rule({ text, valid }){
    return (
        <View style={styles.ruleRow}>
            <MaterialCommunityIcons
                name={valid ? "check-circle": "close-circle"}
                color={valid ? "green" : "#ccc"}
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
        marginTop: 10,
        paddingBottom: 40
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
        marginBottom: 4,
        fontWeight: "600",
        color: "#333",
        fontSize: 15
    },

    input: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        marginBottom: 12,
        borderColor: "#ccc",
        borderWidth: 1.5,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2
    },

    focusedInput: {
        borderColor: "#4c8dff",
        borderWidth: 2
    },

    validInput: {
        borderColor: "#2ecc71",
        borderWidth: 2
    },

    invalidInput: {
        borderColor: "#e74c3c",
        borderWidth: 2
    },

    calendarIcon: {
        position: "absolute",
        right: 16,
        top: 18
    },

    passwordWrapper: {
        position: "relative",
        marginBottom: 16
    },

    passwordInputContainer: {
        position: "relative"
    },

    passwordInput: {
        paddingRight: 50
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
        marginTop: 5,
        
    },

    disabledButton: {
        opacity: 0.45
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 17
    },

    errorText: {
        color: "#e74c3c",
        marginTop: -10,
    }

})