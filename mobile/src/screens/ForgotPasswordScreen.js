import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { requestPasswordReset } from "../components/api";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleReset = async () => {
    if (!emailValid) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      await requestPasswordReset(email)

      Alert.alert(
        "Check your email",
        "If an account exists, a reset link has been sent.",
      );

      navigation.goBack();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Something went wrong.");
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
          maskElement={<Text style={styles.title}>Reset Password</Text>}
        >
          <LinearGradient
            colors={["#b36bff", "#ff4fa3"]}
            start={[0, 0]}
            end={[1, 1]}
          >
            <Text style={[styles.title, { opacity: 0 }]}>Reset Password</Text>
          </LinearGradient>
        </MaskedView>

        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset link
        </Text>

        {/* EMAIL */}
        <TextInput
          placeholder="Enter email or username"
          value={email}
          autoCapitalize="none"
          onChangeText={setEmail}
          style={styles.input}
        />

        <TouchableOpacity onPress={handleReset}>
          <LinearGradient
            colors={["#b36bff", "#ff4fa3"]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
                {loading ? "Sending..." : "Send Reset Link"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
        marginTop: 100
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

    button: {
        paddingVertical: 16,
        borderRadius: 999,
        alignItems: "center",
        marginTop: 5,
        
    },

    buttonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 17
    },

});
