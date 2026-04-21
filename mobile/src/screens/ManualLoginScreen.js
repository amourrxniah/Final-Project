import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { useState } from "react";
import { loginManual } from "../components/api";

export default function ManualLoginScreen({ navigation }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* validation */
  const canSubmit = identifier.trim().length && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit) return;

    try {
      setLoading(true);

      //save token
      await loginManual(identifier, password);

      navigation.replace("MainTabs", { screen: "Home" });
    } catch (error) {
      console.log("Login error:", error.response?.data || error.message);

      if (error.response) {
        //backend responded with error
        const status = error.response.status;
        if (status === 401) {
          setErrorMessage("Invalid username/email or password.");
        } else if (status >= 404) {
          setErrorMessage("No account found with that username/email.");
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      } else {
        //network error
        setErrorMessage(
          "Cannot connect to server. Check your internet or backend.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* BACK */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <MaterialCommunityIcons
          name="arrow-left"
          size={30}
        ></MaterialCommunityIcons>
      </TouchableOpacity>

      {/* CONTENT */}
      <View style={styles.content}>
        {/* GRADIENT TITLE */}
        <MaskedView
          maskElement={<Text style={styles.title}>Welcome Back</Text>}
        >
          <LinearGradient
            colors={["#b36bff", "#ff4fa3"]}
            start={[0, 0]}
            end={[1, 1]}
          >
            <Text style={[styles.title, { opacity: 0 }]}>Welcome Back </Text>
          </LinearGradient>
        </MaskedView>

        <Text style={styles.subtitle}>Log in to your MoodSync account</Text>

        {/* EMAIL */}
        <Text style={styles.label}>Email or Username</Text>
        <TextInput
          placeholder="Enter email or username"
          value={identifier}
          autoCapitalize="none"
          onChangeText={setIdentifier}
          onFocus={() => setFocused("identifier")}
          onBlur={() => setFocused(null)}
          style={[
            styles.input,
            focused === "identifier" && styles.focusedInput,
            identifier.length > 0 && styles.validInput,
          ]}
        ></TextInput>

        {errorMessage ? (
          <Text style={{ color: "red", marginTop: -10 }}>{errorMessage}</Text>
        ) : null}

        {/* PASSWORD */}
        <Text style={styles.label}>Password</Text>

        <View style={styles.passwordWrapper}>
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
              ]}
            />

            {/* TOGGLE EYE */}
            <TouchableOpacity
              style={styles.eye}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#666"
              ></Ionicons>
            </TouchableOpacity>
          </View>

          {/* FORGOT PASSWORD */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotWrapper}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* CREATE ACCOUNT BUTTON */}
          <TouchableOpacity
            disabled={!canSubmit || loading}
            onPress={canSubmit && !loading ? handleLogin : undefined}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#b36bff", "#ff4fa3"]}
              start={[0, 0]}
              end={[1, 1]}
              style={[
                styles.button,
                (!canSubmit || loading) && styles.disabledButton,
              ]}
            >
              <Text style={styles.buttonText}>
                {loading ? "Logging in..." : "Log In"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "#e9eef6",
  },

  back: {
    marginTop: 70,
  },

  content: {
    marginTop: 20,
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
    fontSize: 18,
  },

  label: {
    marginBottom: 6,
    fontWeight: "600",
    color: "#333",
    fontSize: 16,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    fontSize: 18,
    marginBottom: 18,
    borderColor: "#ccc",
    borderWidth: 1.5,
  },

  focusedInput: {
    borderColor: "#4c8dff",
    borderWidth: 2,
  },

  validInput: {
    borderColor: "#2ecc71",
    borderWidth: 2,
  },

  passwordWrapper: {
    position: "relative",
    marginBottom: 16,
  },

  passwordInputContainer: {
    position: "relative",
  },

  passwordInput: {
    paddingRight: 50,
    marginBottom: 0,
  },

  eye: {
    position: "absolute",
    right: 16,
    top: 18,
  },

  forgotWrapper: {
    alignItems: "flex-end",
    marginBottom: 30,
  },

  forgotText: {
    color: "#b36bff",
    fontSize: 14,
    fontWeight: "600",
  },

  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.5,
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  rulesBubbleRight: {
    position: "absolute",
    right: 0,
    top: -120,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderColor: "#ddd",
    borderWidth: 1,
    zIndex: 1000,
  },

  triangleRight: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    alignSelf: "flex-end",
    marginRight: 10,
    marginBottom: 4,
  },

  rules: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "ddd",
  },

  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  ruleText: {
    marginLeft: 6,
    fontSize: 14,
  },
});
