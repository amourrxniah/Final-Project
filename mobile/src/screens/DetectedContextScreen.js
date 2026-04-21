import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useEffect, useState, useRef } from "react";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import AIAssistant from "../components/AIAssistant/AIAssistant";
import { getContext } from "../components/api";
import { useMood } from "../components/MoodContext";

/* -------------------- HELPERS -------------------- */
const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function DetectedContextScreen({ navigation }) {
  const { moodData, setMoodData } = useMood();

  const [timeOfDay, setTimeOfDay] = useState("");
  const [weather, setWeather] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  /* -------------------- INIT -------------------- */
  useEffect(() => {
    detectTime();
    detectContext();
  }, []);

  /* -------------------- TIME -------------------- */
  const detectTime = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) return "morning";
    if (hour < 16) return "afternoon";
    if (hour < 21) return "evening";
    return "night";
  };

  /* -------------------- CONTEXT -------------------- */
  const detectContext = async () => {
    setLoading(true);
    setError(null);

    try {
      // location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }

      // get location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // api call
      const data = await getContext(latitude, longitude);

      if (!data?.weather) {
        throw new Error("Weather unavailable");
      }

      const detectedTime = detectTime();

      // save locally
      setWeather(data.weather);
      setTimeOfDay(detectedTime);

      // save globally
      setMoodData((prev) => ({
        ...prev,
        timeOfDay: detectedTime,
        weather: data.weather,
      }));

      // smooth fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.log("Context detection failed:", err.message);
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#b36bff" />
        <Text style={styles.loaderText}>Detecting your context...</Text>
      </View>
    );
  }

  /* -------------------- CONFIG -------------------- */
  const getTimeConfig = () => {
    const map = {
      morning: {
        icon: "weather-sunset-up",
        colors: ["#ffe29f", "#ffa99f"],
      },
      afternoon: {
        icon: "weather-sunny",
        colors: ["#ffd194", "#ff6a88"],
      },
      evening: {
        icon: "weather-sunset-down",
        colors: ["#667eea", "#764ba2"],
      },
      night: {
        icon: "weather-night",
        colors: ["#0f2027", "#203a43"],
      },
    };
    return map[timeOfDay] || map.morning;
  };

  const getWeatherConfig = () => {
    if (!weather || !weather.condition) return null;

    const condition = weather.condition.toLowerCase();

    if (condition.includes("rain")) {
      return {
        icon: "weather-rainy",
        colors: ["#4e54c8", "#8f94fb"],
      };
    }

    if (condition.includes("cloud")) {
      return {
        icon: "weather-cloudy",
        colors: ["#bdc3c7", "#2c3e50"],
      };
    }

    if (condition.includes("sun") || condition.includes("clear")) {
      return {
        icon: "weather-sunny",
        colors: ["#f6d365", "#fda085"],
      };
    }

    return {
      icon: "weather-partly-cloudy",
      colors: ["#a1c4fd", "#c2e9fb"],
    };
  };

  const timeConfig = getTimeConfig();
  const weatherConfig = getWeatherConfig();

  const aiContext = {
    timeOfDay,
    weather: weather
      ? `${weather.condition}, ${weather.temperature}°C`
      : "unknown",
  };

  return (
    <View style={styles.container}>
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
            maskElement={<Text style={styles.title}>Detected Context</Text>}
          >
            <LinearGradient
              colors={["#b36bff", "#ff4fa3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.title, { opacity: 0 }]}>
                Detected Context
              </Text>
            </LinearGradient>
          </MaskedView>

          <Text style={styles.subtitle}>
            We found your current setting details
          </Text>
        </View>
      </View>

      {/* CONTEXT CARDS */}
      <View style={styles.cardsContainer}>
        {/* TIME OF DAY */}
        <LinearGradient colors={timeConfig.colors} style={styles.gradientCard}>
          <MaterialCommunityIcons
            name={timeConfig.icon}
            size={60}
            color="#fff"
          />
          <View>
            <Text style={styles.cardLabel}>Time of Day</Text>
            <Text style={styles.cardValue}>{capitalize(timeOfDay)}</Text>
          </View>
        </LinearGradient>

        {/* WEATHER*/}
        {weatherConfig && (
          <LinearGradient
            colors={weatherConfig.colors}
            style={styles.gradientCard}
          >
            <MaterialCommunityIcons
              name={weatherConfig.icon}
              size={60}
              color="#fff"
            />
            <View>
              <Text style={styles.cardLabel}>Weather</Text>
              <Text style={styles.cardValue}>
                {capitalize(weather.condition)} • {weather.temperature}°C
              </Text>
            </View>
          </LinearGradient>
        )}
      </View>

      {/* CONTINUE BUTTON */}
      <TouchableOpacity onPress={() => navigation.navigate("Overview")}>
        <LinearGradient
          colors={["#b36bff", "#ff4fa3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.continueBtn}
        >
          <Text style={styles.continueText}>Get activity recommendations</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* AI ASSISTANT */}
      <AIAssistant mood="context" context={aiContext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#e9eef6",
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

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },

  cardsContainer: {
    marginTop: 40,
    marginBottom: 40,
  },

  gradientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 32,
    paddingVertical: 38,
    minHeight: 150,
    borderRadius: 26,
    marginBottom: 22,
  },

  cardLabel: {
    fontSize: 26,
    color: "rgba(255,255,255,0.85)",
  },

  cardValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
  },

  continueBtn: {
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 110,
  },

  continueText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 19,
  },
});
