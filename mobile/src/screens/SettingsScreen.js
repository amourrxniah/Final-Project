import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import AIAssistant from "../components/AIAssistant/AIAssistant";
import BottomNav from "../components/BottomNav";
import { getSettings, saveSettings } from "../components/api";

/* -------------------- THEME -------------------- */
const lightTheme = {
  bg: "#f0f8ff",
  card: "#fff",
  text: "#111",
};

const darkTheme = {
  bg: "#0f172a",
  card: "#1e293b",
  text: "#fff",
};

const ACCENT = "#4cc9f0";

/* -------------------- SETTINGS SCREEN -------------------- */
export default function SettingsScreen({ navigation }) {
  const [settings, setSettings] = useState({
    notifs: true,
    darkMode: false,
    sounds: true,
    dataCollect: true,
    language: "English (UK)",
  });

  const [langModal, setLangModal] = useState(false);
  const theme = settings.darkMode ? darkTheme : lightTheme;

  const languages = ["English (UK)", "English (US)", "Spanish", "French"];

  /* -------------------- LOAD SETTINGS -------------------- */
  useEffect(() => {
    (async () => {
      const saved = await getSettings();
      if (saved) setSettings((prev) => ({ ...prev, ...saved }));
    })();
  }, []);

  /* -------------------- UPDATE -------------------- */
  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await saveSettings(updated);
  };

  /* -------------------- UI -------------------- */
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <MaterialCommunityIcons name="arrow-left" size={30} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <MaskedView
              maskElement={<Text style={styles.headerTitle}>Settings</Text>}
            >
              <LinearGradient
                colors={["#4361ee", "#4cc9f0", "#2ec4b6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.headerTitle, { opacity: 0 }]}>
                  Settings
                </Text>
              </LinearGradient>
            </MaskedView>
          </View>

          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subtitle}>Customise your MoodSync experience</Text>

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PREFERENCES */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={styles.cardTitle}>Preferences</Text>

            <SettingRow
              icon="bell-outline"
              label="Notifications"
              desc="Mood sync reminders and insights"
              value={settings.notifs}
              onChange={(v) => updateSetting("notifs", v)}
            />

            <SettingRow
              icon="weather-night"
              label="Dark Mode"
              desc="Switch to dark theme"
              value={settings.darkMode}
              onChange={(v) => updateSetting("darkMode", v)}
            />

            <SettingRow
              icon="volume-high"
              label="Sound Effects"
              desc="Enable app sounds"
              value={settings.sounds}
              onChange={(v) => updateSetting("sounds", v)}
            />

            <NavRow
              icon="translate"
              label="Language"
              desc={settings.language}
              onPress={() => setLangModal(true)}
            />
          </View>

          {/* PRIVACY */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={styles.cardTitle}>Privacy & Security</Text>

            <NavRow
              icon="shield-outline"
              label="Privacy Policy"
              desc="Review our privacy pracitices"
            />

            <NavRow
              icon="lock-outline"
              label="Data Encryption"
              desc="AES-256 encryption enabled"
            />

            <SettingRow
              icon="database"
              label="Data Collection"
              desc="Anonymous usage analytics"
              value={settings.dataCollect}
              onChange={(v) => updateSetting("dataCollect", v)}
            />

            <NavRow
              icon="download"
              label="Export My Data"
              desc="Download all your data"
            />

            <NavRow icon="delete" label="Delete All Data" danger />
          </View>

          {/* SUPPORT */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={styles.cardTitle}>Security</Text>

            <NavRow
              icon="help-circle-outline"
              label="Help Center"
              desc="Get help and tutorials"
            />

            <NavRow
              icon="file-document-outline"
              label="Terms of Service"
              desc="Read our terms"
            />

            <NavRow
              icon="information-outline"
              label="About MoodSync"
              desc="Version 1.0.0"
            />
          </View>

          {/* GDPR */}
          <View style={styles.gdpr}>
            <Text style={styles.gdprTitle}>GRPR Compliant</Text>
            <Text style={styles.gdprText}>
              MoodSync is fully compliant with GDPR and other data protection
              regulations. Your mood and activity data is encrypted and stored
              securely on your device. You have full control over your data and
              can export or delete it at any time
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* LANGUAGE MODAL */}
      <Modal visible={langModal} transparent animationType="slide">
        <View style={styles.modal}>
          <View style={styles.modalCard}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={styles.langItem}
                onPress={() => {
                  updateSetting("language", lang);
                  setLangModal(false);
                }}
              >
                <Text>{lang}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <AIAssistant />
      <BottomNav navigation={navigation} active={"settings"} />
    </View>
  );
}

/* -------------------- ROWS -------------------- */
const SettingRow = ({ icon, label, desc, value, onChange }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 0.92,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggle = () => {
    animatePress();
    onChange(!value);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={styles.row} onPress={toggle}>
        <View style={[styles.iconWrap, { backgroundColor: `${ACCENT}20` }]}>
          <MaterialCommunityIcons name={icon} size={30} color={ACCENT} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.desc}>{desc}</Text>
        </View>

        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: "#ccc", true: "#9de0ff" }}
          thumbColor={value ? ACCENT : "#fff"}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const NavRow = ({ icon, label, desc, danger, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress}>
    <View style={styles.iconWrap}>
      <MaterialCommunityIcons name={icon} size={30} color={ACCENT} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={[styles.label, danger && { color: "red" }]}>{label}</Text>
      {desc && <Text style={styles.desc}>{desc}</Text>}
    </View>

    <MaterialCommunityIcons name="chevron-right" size={30} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 10,
  },

  back: {
    width: 40,
  },

  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 18,
    color: "#555",
    marginTop: 8,
    marginBottom: 5,
    lineHeight: 20,
  },

  dividerRow: {
    position: "relative",
    height: 20,
    marginTop: 6,
    justifyContent: "center",
  },

  dividerLine: {
    height: 2,
    backgroundColor: "#d0d0d0",
    position: "absolute",
    left: -18,
    right: -18,
  },

  scrollContent: {
    paddingBottom: 260,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },

  cardTitle: {
    fontWeight: "700",
    marginBottom: 10,
    color: "#555",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: "#9b5de520",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
  },

  desc: {
    fontSize: 12,
    color: "#777",
  },

  gdpr: {
    backgroundColor: "#e9ddff",
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },

  gdprTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },

  gdprText: {
    fontSize: 13,
    color: "#555",
  },

  modal: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  langItem: {
    paddingVertical: 14,
  },
});
