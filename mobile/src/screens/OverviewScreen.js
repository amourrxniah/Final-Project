import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRoute } from "@react-navigation/native";

/* HELPERS */
const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

/* CONFIG MAPS */
const moodConfig = (mood) => {
  if (mood === "low") {
    return {
      label: "Low Energy",
      icon: "emoticon-sad-outline",
      color: "#4dabf7",
      bg: "#e3f2fd",
    };
  }
  if (mood === "neutral") {
    return {
      label: "Neutral Energy",
      icon: "emoticon-neutral-outline",
      color: "#9b5de5",
      bg: "#f3e8ff",
    };
  }
  if (mood === "high") {
    return {
      label: "High Energy",
      icon: "emoticon-happy-outline",
      color: "#ff4fa3",
      bg: "#ffe3f1",
    };
  }
  return {
    label: "Unknown",
    icon: "emoticon-outline",
    color: "#999",
    bg: "#f0f0f0",
  };
};

const getWeatherIcon = (condition) => {
  if (!condition) return "weather-partly-cloudy";
  const c = condition.toLowerCase();
  if (c.includes("rain")) return "weather-rainy";
  if (c.includes("cloud")) return "weather-cloudy";
  if (c.includes("sun") || c.includes("clear")) return "weather-sunny";
  if (c.includes("storm")) return "weather-lightning";
  if (c.includes("snow")) return "weather-snowy";
  return "weather-partly-cloudy";
};

export default function OverviewScreen({ navigation }) {
  const route = useRoute();

  const mood = route?.params?.mood ?? null;
  const moodTime = route?.params?.moodTime ?? new Date().toISOString();
  const timeOfDay = (route?.params?.timeOfDay ?? "evening").toLowerCase();
  const weather = route?.params?.weather ?? null;

  const { label, icon, color, bg } = moodConfig(mood);
  const weatherIcon = getWeatherIcon(weather?.condition);

  const getTimeGradient = () => {
    switch (timeOfDay) {
      case "morning":
        return ["#ffe29f", "#ffa99f"];
      case "afternoon":
        return ["#ffd194", "#ff6a88"];
      case "evening":
        return ["#667eea", "#764ba2"];
      case "night":
        return ["#0f2027", "#203a43"];
      default:
        return ["#b993d6", "#8ca6db"];
    }
  };

  const getWeatherGradient = () => {
    if (!weather?.condition) return ["#e9c3fc", "#8ec5fc"];
    const c = weather.condition.toLowerCase();
    if (c.includes("rain")) return ["#897f7e", "#66a6ff"];
    if (c.includes("cloud")) return ["#d7d2cc", "#304352"];
    if (c.includes("sun") || c.includes("clear")) return ["#fee140", "#fa709a"];
    return ["#e0c3fc", "#8ec5fc"];
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
              maskElement={<Text style={styles.title}>Your Sync</Text>}
            >
              <LinearGradient
                colors={["#b36bff", "#ff4fa3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.title, { opacity: 0 }]}>Your Sync</Text>
              </LinearGradient>
            </MaskedView>

            <Text style={styles.subtitle}>Mood + environment analysis</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.syncCard}>
            {/* YOUR MOOD */}
            <View style={styles.sectionTight}>
              <Text style={styles.sectionTitle}>Your Mood</Text>

              <View style={[styles.moodCard, { backgroundColor: bg }]}>
                <MaterialCommunityIcons name={icon} size={50} color={color} />
                <View>
                  <Text style={styles.moodValue}>{label}</Text>
                  <Text style={styles.moodSub}>
                    Logged at {formatTime(moodTime)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            {/* CURRENT CONTEXT */}
            <View style={styles.sectionTight}>
              <Text style={styles.sectionTitle}>Current Context</Text>

              <View style={styles.contextCard}>
                {/* TIME */}
                <LinearGradient
                  colors={getTimeGradient()}
                  style={styles.contextRow}
                >
                  <MaterialCommunityIcons
                    name={
                      timeOfDay === "morning"
                        ? "weather-sunset-up"
                        : timeOfDay === "afternoon"
                          ? "weather-sunny"
                          : timeOfDay === "evening"
                            ? "weather-sunset-down"
                            : "weather-night"
                    }
                    size={50}
                    color="#fff"
                  />
                  <View>
                    <Text style={styles.contextLabel}>Time of Day</Text>
                    <Text style={styles.contextValue}>
                      {capitalize(timeOfDay)}
                    </Text>
                  </View>
                </LinearGradient>

                {/* WEATHER */}
                <LinearGradient
                  colors={getWeatherGradient()}
                  style={styles.contextRow}
                >
                  <MaterialCommunityIcons
                    name={weatherIcon}
                    size={50}
                    color="#fff"
                  />
                  <View>
                    <Text style={styles.contextLabel}>Weather</Text>
                    <Text style={styles.contextValue}>
                      {weather
                        ? `${capitalize(weather.condition)}, ${weather.temperature}°C`
                        : "Unknown"}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* EXPLANATION */}
          <View style={styles.explainerCard}>
            <Text style={styles.explainer}>
              Based on your {label.toLowerCase()} mood and current{" "}
              {timeOfDay.toLowerCase()} conditions, we've found 4 activities
              that match you perfectly.
            </Text>

            <Text style={styles.explainerSub}>
              Each recommendation is tailored to your mood, environment and
              wellbeing.
            </Text>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        {/* CONTINUE BUTTON */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Recommendations", {
              mood,
              weather,
              timeOfDay,
            })
          }
        >
          <LinearGradient
            colors={["#b36bff", "#ff4fa3"]}
            style={styles.continueBtn}
          >
            <Text style={styles.continueText}>View recommendations</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e9eef6",
  },

  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 24,
  },

  scrollArea: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
    position: "relative",
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

  syncCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    borderWidth: 1,
    padding: 26,
    borderColor: "#ddd",
  },

  sectionTight: {
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 14,
  },

  moodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    padding: 24,
    borderRadius: 24,
    elevation: 2,
  },

  moodValue: {
    fontSize: 19,
    fontWeight: "700",
  },

  moodSub: {
    fontSize: 14,
    color: "#700",
    marginTop: 4,
  },

  separator: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
  },

  contextCard: {
    gap: 14,
  },

  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 18,
  },

  contextLabel: {
    fontSize: 19,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "700",
  },

  contextValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginTop: 4,
  },

  explainerCard: {
    marginTop: 20,
    backgroundColor: "#f3e8ff",
    borderRadius: 22,
    padding: 22,
  },

  explainer: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 26,
    textAlign: "center",
    color: "#4a2b7c",
  },

  explainerSub: {
    marginTop: 10,
    fontSize: 16,
    color: "#5f4b8b",
    lineHeight: 24,
    textAlign: "center",
  },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f0f8ff",
  },

  continueBtn: {
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },

  continueText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 19,
  },
});
