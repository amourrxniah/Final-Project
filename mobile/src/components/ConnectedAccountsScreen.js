import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { useState } from "react";

export default function ConnectedAccountsScreen({ navigation }) {
  const [accounts, setAccounts] = useState({
    google: true,
    apple: false,
    email: true
  });

  const toggle = async (key) => {
    const current = accounts[key];

    //confirm toggle off
    if (current) {
      Alert.alert(
        "Disconnect Account",
        `Are you sure you want to disconnext your ${key} account?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disconnect",
            style: "destructive",
            onPress: async () => {
              const updated = { ...acounts, [key]: false };
              setAccounts(updated);

              await AsyncStorage.setItem(
                "connected_accounts",
                JSON.stringify(updated)
              );
            },
          },
        ],
      );
    } else {
      // turning on
      const updated = { ...acounts, [key]: true };
      setAccounts(updated);       

      await AsyncStorage.setItem(
        "connected_accounts",
        JSON.stringify(updated)
      );
    }
    setAccounts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
          maskElement={<Text style={styles.title}>Connected Accounts</Text>}
        >
          <LinearGradient
            colors={["#b36bff", "#ff4fa3"]}
            start={[0, 0]}
            end={[1, 1]}
          >
            <Text style={[styles.title, { opacity: 0 }]}>
              Connected Accounts{" "}
            </Text>
          </LinearGradient>
        </MaskedView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <BlurView intensity={60} tint="light" style={styles.card}>
          <AccountRow 
            icon="google" 
            text="Google"
            color="#db4437" 
            active={accounts.google} 
            onToggle={() => toggle("google")}
          />

          <AccountRow 
            icon="apple" 
            text="Apple"
            color="#000"
            active={accounts.apple} 
            onToggle={() => toggle("apple")}
          />

          <AccountRow 
            icon="email" 
            text="Email"
            color="#3a86ff"
            active={accounts.email} 
            onToggle={() => toggle("email")}
          />
        </BlurView>
      </ScrollView>
    </View>
  );
}

const AccountRow = ({ icon, text, color, active, onToggle }) => (
  <View style={styles.row}>
    <View style={[styles.iconWrap, { backgroundColor: color + "20"}]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    
    <Text style={styles.text}>{text}</Text>

    <Switch 
      value={active}
      onValueChange={onToggle}
      trackColor={{ false: "#ccc", true: "#06d6a0" }}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "#f0f8ff",
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
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 18,
    marginTop: 10,
    elevation: 4
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },

  text: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },

  btn: {
    backgroundColor: "#9b5de5",
    padding: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
});
