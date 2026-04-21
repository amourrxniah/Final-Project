import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Easing,
  Image,
  useWindowDimensions,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import ProductionChart from "../components/ProductionChart";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AIAssistant from "../components/AIAssistant/AIAssistant";
import {
  getCurrentUser,
  getMoodStats,
  getMoodTrend,
  getRecentActivity,
  uploadProfileImg,
  updateUserProfile,
  BACKEND_URL,
} from "../components/api";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/* -------------------- HOME SCREEN -------------------- */
export default function HomeScreen({ navigation }) {
  const [name, setName] = useState("User");
  const [profileImage, setProfileImage] = useState(null);
  const [stats, setStats] = useState({
    total_syncs: 0,
    current_streak: 0,
    most_common_mood: null,
  });

  const [editModalVisible, setEditModaVisible] = useState(false);
  const [newName, setNewName] = useState("");

  const [trend, setTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [insight, setInsight] = useState("");

  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [viewMode, setViewMode] = useState("live");

  /* -------------------- PICK IMAGE-------------------- */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant permission to access your photos",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      const img = result.assets[0];

      try {
        const uploadedUrl = await uploadProfileImg(img);
        const fullUrl = `${BACKEND_URL}${uploadedUrl}`;

        //update ui
        setProfileImage(fullUrl);

        await updateUserProfile({ profile_image: uploadedUrl });

        //save locally
        await AsyncStorage.setItem("profile_image", fullUrl);

        Alert.alert("Success", "Profile picture updated!");
      } catch (e) {
        console.log("Upload error", e);
        Alert.alert("Error", "Failed to update profile picture");
      }
    }
  };

  /* -------------------- EDIT NAME -------------------- */
  const saveName = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    try {
      await updateUserProfile({ name: newName.trim() });
      setName(newName.trim());
      setEditModaVisible(false);
      Alert.alert("Success", "Name updated successfully!");
    } catch (e) {
      console.log("Update name error", e);
      Alert.alert("Error", "Failed to update name");
    }
  };

  const openEditModal = () => {
    setNewName(name);
    setEditModaVisible(true);
  };

  /* -------------------- LOAD CORE DATA -------------------- */
  const loadCore = async () => {
    try {
      const cachedImage = await AsyncStorage.getItem("profile_image");
      if (cachedImage) {
        setProfileImage(cachedImage);
      }

      const [user, statsData, activityData] = await Promise.all([
        getCurrentUser(),
        getMoodStats(),
        getRecentActivity(),
      ]);

      setName(user.name || user.username || "User");

      if (user.profile_image) {
        const imageUrl = user.profile_image.startsWith("http")
          ? user.profile_image
          : `${BACKEND_URL}${user.profile_image}`;

        setProfileImage(imageUrl);

        await AsyncStorage.setItem("profile_image", imageUrl);
      }

      setStats(statsData);
      setRecentActivity(activityData || []);
    } catch (err) {
      console.log("Core load error:", err.response?.data || err.message);
    }
  };

  /* -------------------- LOAD TREND ONLY -------------------- */
  const loadTrend = async (mode) => {
    try {
      setTrendLoading(true);

      const data = await getMoodTrend(mode);
      const safeData = (data || []).map((d) => ({
        ...d,
        value: Math.max(0, Math.min(2, Number(d.value) || 1)),
        has_data: d.has_data ?? true,
      }));

      setTrend(safeData);
    } catch (err) {
      console.log("Trend load error:", err.response?.data || err.message);
      setTrend([]);
    } finally {
      setTrendLoading(false);
    }
  };

  /* -------------------- INITIAL LOAD -------------------- */
  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        setLoading(true);
        await loadCore();
        await loadTrend("live");
        setLoading(false);
      };
      init();
    }, []),
  );

  /* -------------------- TREND MODE CHANGE -------------------- */
  useEffect(() => {
    loadTrend(viewMode);
  }, [viewMode]);

  /* -------------------- AUTO REFRESH TREND -------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      loadTrend(viewMode);
    }, 30000); //every 5s
    return () => clearInterval(interval);
  }, [viewMode]);

  /* -------------------- PULL TO REFRESH -------------------- */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCore();
    await loadTrend(viewMode);
    setRefreshing(false);
  };

  /* -------------------- TIME AGO -------------------- */
  const timeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return "Just now";

    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;

    const hrs = Math.floor(diff / 3600);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;

    const days = Math.floor(diff / 86400);
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

    const weeks = Math.floor(diff / 604800);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  };

  /* -------------------- FUN RANDOM INSIGHTS -------------------- */
  useEffect(() => {
    const aiMessages = [
      `You're on a ${stats.current_streak}-day streak — momentum is building.`,
      `Your dominant mood (${stats.most_common_mood || "emerging"}) shows a pattern worth reflecting on.`,
      `Emotional stability appears to be trending positively.`,
      `Your logging pattern shows strong self-reflection.`,
    ];
    setInsight(aiMessages[Math.floor(Math.random() * aiMessages.length)]);
  }, [stats]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#9b5de5"
          style={{ marginTop: 200 }}
        />
      </View>
    );
  }

  /* -------------------- RENDER LIST -------------------- */
  return (
    <View style={styles.container}>
      {/* MAIN CONTENT */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={pickImage} style={styles.profileButton}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileIcon}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={50}
                  color="#fff"
                />
              </View>
            )}
            <View style={styles.editIconOverlay}>
              <MaterialCommunityIcons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.welcome}>Welcome Back</Text>
            <TouchableOpacity onPress={openEditModal}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{name}</Text>
                <MaterialCommunityIcons
                  name="pencil"
                  size={18}
                  color="#9b5de5"
                  style={styles.editIcon}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* READY CARD */}
        <LinearGradient
          colors={["#b36bff", "#ff4fa3"]}
          style={styles.readyCard}
        >
          <View style={styles.readyHeader}>
            <MaterialCommunityIcons
              name="star-four-points"
              size={34}
              color="#fff"
            />
            <Text style={styles.readyTitle}>Ready for your next activity </Text>
          </View>

          <Text style={styles.readyDescription}>
            Log your current mood and we'll find the perfect activity for you
          </Text>

          <TouchableOpacity
            style={styles.moodButton}
            onPress={() => navigation.navigate("MoodInput")}
          >
            <Text style={styles.moodButtonText}>Start Mood Log</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatCard
            icon="pulse"
            label="Total Syncs"
            color="#9b5de5"
            value={stats.total_syncs}
          />

          <StreakRing streak={stats.current_streak} />

          <StatCard
            icon="battery-low"
            label="Most Common"
            color="#4dabf7"
            value={stats.most_common_mood ?? "-"}
          />
        </View>

        {/* 7 DAY MOOD TREND */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="trending-up"
              size={35}
              color="#ba55d3"
            />

            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.cardTitle}>Mood Trend</Text>
              <Text style={styles.chartHint}>
                Tap a point to see exact mood
              </Text>
            </View>

            <View style={{ marginTop: 4 }}></View>
          </View>

          <SegmentedControl value={viewMode} onChange={setViewMode} />

          <View style={{ position: "relative" }}>
            <ProductionChart data={trend} viewMode={viewMode} />

            {trendLoading && (
              <View style={styles.chartOverlay}>
                <ActivityIndicator size="large" color="#9b5de5" />
              </View>
            )}
          </View>

          <MoodLegend />
        </View>

        {/* RECENT ACTIVITY */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={35}
              color="#9b5de5"
            />
            <Text style={styles.cardTitle}>Recent Activity</Text>
          </View>

          <ScrollView
            style={{ maxHeight: 260 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {recentActivity.map((item, i) => (
              <ActivityRow
                key={i}
                item={item}
                sub={timeAgo(item.timestamp)}
                navigation={navigation}
              />
            ))}
          </ScrollView>
        </View>

        {/* INSIGHTS */}
        <View style={[styles.card, styles.insightsCard]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={35}
              color="#f4c430"
            />
            <Text style={styles.cardTitle}>Insights</Text>
          </View>

          <View style={styles.insightRow}>
            <Text style={styles.insightText}>{insight}</Text>
          </View>

          <View style={styles.insightRow}>
            <MaterialCommunityIcons name="flare" size={30} color="#dc143c" />
            <Text style={styles.insightText}>
              Keep logging your mood to unlock personalised insights
            </Text>
          </View>
        </View>
      </ScrollView>
      <AIAssistant />

      {/* EDIT NAME MODAL */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModaVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StreakRing({ streak }) {
  const size = 95;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animated = useRef(new Animated.Value(0)).current;

  const progress = Math.min(streak / 30, 1); //30 day goal

  useEffect(() => {
    Animated.timing(animated, {
      toValue: progress,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [streak]);

  const strokeDashoffset = animated.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.streakCard}>
      <Svg width={size} height={size}>
        <Circle
          stroke="#e6e6f2"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />

        <AnimatedCircle
          stroke="#6ed3c6"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      <View style={styles.streakCenter}>
        <Text style={styles.streakNumber}>{streak}</Text>
        <Text style={styles.streakLabel}>Day Streak</Text>
      </View>
    </View>
  );
}

function StatCard({ icon, label, color, value }) {
  const animated = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const id = animated.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    Animated.timing(animated, {
      toValue: Number(value) || 0,
      duration: 900,
      useNativeDriver: false,
    }).start();

    return () => {
      animated.removeListener(id);
    };
  }, [value]);

  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={32} color={color} />
      <Text style={styles.statValue}>
        {typeof value === "number" ? displayValue : value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* -------------------- LEGEND -------------------- */
function MoodLegend() {
  return (
    <View style={styles.legendRow}>
      <LegendItem color="#ff4fa3" label="Low" />
      <LegendItem color="#9b5de5" label="Neutral" />
      <LegendItem color="#2ec4b6" label="High" />
    </View>
  );
}

function LegendItem({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text>{label}</Text>
    </View>
  );
}

function ActivityRow({ item, sub, navigation }) {
  if (!item) return null;
  const isMoodLog = !!item.mood;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    if (item.activity_id) {
      navigation.navigate("ActivityDetails", {
        activity: {
          id: item.activity_id,
          title: item.title,
        },
      });
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={handlePress} style={styles.activityRow}>
        <View>
          <Text style={styles.activityTitle}>
            {isMoodLog ? `Mood: ${item.mood}` : item.title}
          </Text>
          <Text style={styles.activitySub}>{sub}</Text>
        </View>

        <View style={isMoodLog ? styles.tagSuccess : styles.tagNeutral}>
          <Text style={styles.tagText}>{isMoodLog ? "Logged" : "Viewed"}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
/* -------------------- ANIMATED SEGMENTED CONTROL -------------------- */
function SegmentedControl({ value, onChange }) {
  const { width } = useWindowDimensions();
  const translate = useRef(new Animated.Value(0)).current;

  const segments = ["live", "yesterday", "week", "month"];

  const containerWidth = width - 70; //matches padding
  const segmentWidth = containerWidth / segments.length;

  useEffect(() => {
    const index = segments.indexOf(value);

    Animated.spring(translate, {
      toValue: index,
      useNativeDriver: true,
    }).start();
  }, [value]);

  const translateX = translate.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, segmentWidth, segmentWidth * 2, segmentWidth * 3],
  });

  return (
    <View style={[styles.segmentContainer, { width: containerWidth }]}>
      <Animated.View
        style={[
          styles.segmentHighlight,
          {
            width: segmentWidth,
            transform: [{ translateX }],
          },
        ]}
      />
      {segments.map((mode) => (
        <TouchableOpacity
          key={mode}
          style={styles.segment}
          activeOpacity={0.8}
          onPress={() => onChange(mode)}
        >
          <Text
            style={[
              styles.segmentText,
              value === mode && styles.segmentTextActive,
            ]}
          >
            {mode === "live"
              ? "24H"
              : mode === "yesterday"
                ? "Yesterday"
                : mode === "week"
                  ? "7 Days"
                  : "30 Days"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e9eef6",
  },

  content: {
    padding: 20,
    paddingBottom: 80,
    marginTop: 23,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    fontSize: 22,
    fontWeight: "500",
  },

  profileIcon: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: "#c77dff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 15,
  },

  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 15,
  },

  profileButton: {
    position: "relative",
  },

  headerTextContainer: {
    marginLeft: 10,
  },

  editIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#9b5de5",
    borderRadius: 15,
    padding: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  editIcon: {
    marginLeft: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 20,
    fontweight: "600",
    marginBottom: 20,
  },

  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#f0f0f0",
  },

  saveButton: {
    backgroundColor: "#9b5de5",
  },

  cancelButtonText: {
    color: "#666",
    fontweight: "600",
  },

  saveButtonText: {
    color: "#000",
    fontweight: "600",
  },

  welcome: {
    fontSize: 26,
    color: "#666",
    marginTop: 20,
  },

  name: {
    fontSize: 23,
    fontWeight: "600",
  },

  readyCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    marginTop: 5,
    paddingBottom: 20,
  },

  readyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  readyTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 21,
    marginLeft: 10,
  },

  readyDescription: {
    color: "#f5f5f5",
    fontSize: 18,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 10,
  },

  moodButton: {
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },

  moodButtonText: {
    fontSize: 18,
    color: "#c77dff",
    fontWeight: "600",
  },

  streakCard: {
    width: "31%",
    alignItems: "center",
    justifyContent: "center",
  },

  streakCenter: {
    position: "absolute",
    alignItems: "center",
  },

  streakNumber: {
    fontSize: 20,
    fontWeight: "700",
  },

  streakLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  statCard: {
    width: "31%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 12,
    backgroundColor: "#fff",
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },

  statLabel: {
    fontSize: 12.5,
    fontWeight: "500",
    marginTop: 3,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: "600",
    marginLeft: 8,
  },

  chartHint: {
    fontSize: 12,
    color: "#888",
  },

  toggleRow: {
    flexDirection: "row",
    marginLeft: "auto",
    backgroundColor: "#f2f2f2",
    borderRadius: 30,
    padding: 4,
  },

  toggleButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },

  toggleActive: {
    backgroundColor: "#9b5de5",
  },

  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 14,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  legendDot: {
    width: 15,
    height: 15,
    borderRadius: 5,
    marginRight: 6,
  },

  legendText: {
    fontSize: 14,
    color: "#666",
  },

  chartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 18,
  },

  rangeRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },

  rangeButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 6,
    backgroundColor: "#eee",
  },

  rangeActive: {
    backgroundColor: "#9b5de5",
  },

  rangeText: {
    fontWeight: "600",
    color: "#555",
  },

  rangeTextActive: {
    fontWeight: "700",
    color: "#fff",
  },

  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 25,
    marginBottom: 15,
    overflow: "hidden",
  },

  segmentHighlight: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#9b5de5",
    borderRadius: 25,
    shadowColor: "#9b5de5",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  segmentText: {
    color: "#555",
    fontWeight: "600",
  },

  segmentTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  tooltip: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: "#9b5de5",
    borderRadius: 20,
  },

  tooltipText: {
    color: "#fff",
    fontWeight: "600",
  },

  axisTitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderColor: "#f0f0f0",
  },

  activityTitle: {
    fontSize: 17,
    fontWeight: "500",
  },

  activitySub: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },

  tagNeutral: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  tagSuccess: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  tagDanger: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  tagText: {
    fontSize: 16,
    fontWeight: "600",
  },

  insightsCard: {
    backgroundColor: "#f1ecff",
  },

  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  insightText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#6a5acd",
    flex: 1,
  },
});
