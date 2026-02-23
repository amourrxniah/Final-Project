import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import MaskedView from "@react-native-masked-view/masked-view";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AIAssistant from "../components/AIAssistant/AIAssistant";
import BottomNav from "../components/BottomNav";
import axios from "axios";

/* -------------------- CONSTANTS --------------------*/
const SCREEN_HEIGHT = Dimensions.get("window").height;

/* -------------------- MOODS --------------------*/
const moods = [
  {
    key: "low",
    title: "Low Energy",
    desc: "I'm feeling tired and need to recharge",
    icon: "emoticon-sad-outline",
    color: "#4dabf7",
  },
  {
    key: "neutral",
    title: "Neutral Energy",
    desc: "I'm doing okay, open to suggestions",
    icon: "emoticon-neutral-outline",
    color: "#9b5de5",
  },
  {
    key: "high",
    title: "High Energy",
    desc: "I'm feeling great and ready for action",
    icon: "emoticon-happy-outline",
    color: "#ff4fa3",
  },
];

/* -------------------- COMPONENT --------------------*/
export default function MoodInputScreen({ navigation }) {
  /* ----- STATE ----- */
  const [selected, setSelected] = useState(null);

  /* ----- ANIMATIONS ----- */
  const liftAnim = useRef(
    moods.reduce((acc, mood) => {
      acc[mood.key] = new Animated.Value(0);
      return acc;
    }, {}),
  ).current;

  const animateSelect = (key) => {
    setSelected(key);

    Object.keys(liftAnim).forEach((k) => {
      Animated.spring(liftAnim[k], {
        toValue: k === key ? 1 : 0,
        useNativeDriver: true,
        friction: 6,
      }).start();
    });
  };

  /* -------------------- CONTINUE --------------------*/
  const handleContinue = async () => {
    if (!selected) return;

    try {
      const token = await AsyncStorage.getItem("token");

      await axios.post(
        `${BACKEND_URL}/mood/log`,
        { mood: selected },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      navigation.navigate("DetectedContext");
    } catch (err) {
      console.log("Mood save failed", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.back}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={30}
            ></MaterialCommunityIcons>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <MaskedView
              maskElement={
                <Text style={styles.title}>How are you feeling?</Text>
              }
            >
              <LinearGradient
                colors={["#b36bff", "#ff4fa3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.title, { opacity: 0 }]}>
                  How are you feeling?
                </Text>
              </LinearGradient>
            </MaskedView>

            <Text style={styles.subtitle}>
              Select your current energy level
            </Text>
          </View>
        </View>

        {/* MOOD OPTIONS */}
        {moods.map((mood) => {
          const active = selected === mood.key;

          return (
            <Animated.View
              key={mood.key}
              style={{
                transform: [
                  {
                    translateY: liftAnim[mood.key].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -4],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.moodCard,
                  {
                    borderColor: active ? mood.color : "#ddd",
                    backgroundColor: active ? `${mood.color}25` : "#fff",
                  },
                ]}
                onPress={() => animateSelect(mood.key)}
                activeOpacity={0.9}
              >
                <View
                  style={[styles.iconCircle, { backgroundColor: mood.color }]}
                >
                  <MaterialCommunityIcons
                    name={mood.icon}
                    size={34}
                    color="#fff"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.moodTitle}>{mood.title}</Text>
                  <Text style={styles.moodDesc}>{mood.desc}</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* CONTINUE BUTTON */}
        <TouchableOpacity disabled={!selected} onPress={handleContinue}>
          <LinearGradient
            colors={["#b36bff", "#ff4fa3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.continueBtn, { opacity: selected ? 1 : 0.4 }]}
          >
            <Text style={styles.continueText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* AI ASSISTANT */}
        <AIAssistant mood={selected ?? "neutral"} />
      </View>
      <BottomNav navigation={navigation} active="mood" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },

  back: {
    width: 40,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginRight: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 6,
  },

  subtitle: {
    fontSize: 17,
    color: "#666",
    marginTop: 6,
    marginRight: 10,
  },

  moodCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 26,
    minHeight: 110,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 14,
  },

  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 18,
  },

  moodTitle: {
    fontWeight: "600",
    fontSize: 20,
  },

  moodDesc: {
    fontSize: 19,
    color: "#666",
    marginTop: 4,
  },

  continueBtn: {
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 90,
  },

  continueText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 19,
  },
});
