import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import ConfettiCannon from "react-native-confetti-cannon";
import Toast from "react-native-toast-message";

import AIAssistant from "../components/AIAssistant/AIAssistant";
import { useUser } from "../components/UserContext";
import {
  getCurrentUser,
  getMoodStats,
  getAchievements,
  uploadProfileImg,
  getUserActivities,
  updateUserProfile,
  BACKEND_URL,
} from "../components/api";

/* -------------------- COUNT UP HOOK -------------------- */
const useCountUp = (value) => {
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    animated.setValue(0);

    Animated.timing(animated, {
      toValue: value,
      duration: 800,
      useNativeDriver: false,
    }).start();

    const id = animated.addListener(({ value }) => {
      setDisplay(Math.floor(value));
    });

    return () => animated.removeListener(id);
  }, [value]);

  return display;
};

const shortenLocation = (location) => {
  if (!location) return "London";

  const parts = location.split(",");

  if (parts.length >= 2) return parts[1].trim();

  return parts[0];
};

/* -------------------- MAIN -------------------- */
export default function ProfileScreen({ navigation }) {
  const { user, updateUser, getProfileImage, loadUser } = useUser();
  const [stats, setStats] = useState({
    total_syncs: 0,
    current_streak: 0,
  });

  const [activities, setActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [prevAchievements, setPrevAchievements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [name, setName] = useState("");

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, []),
  );

  /* -------------------- FETCH -------------------- */
  const fetchData = async () => {
    try {
      const userData = await getCurrentUser();
      const moodStats = await getMoodStats();
      const ach = await getAchievements();
      const acts = await getUserActivities();

      updateUser(userData || {});
      setName(userData?.name || "");

      setStats({
        total_syncs: moodStats?.total_syncs ?? 0,
        current_streak: moodStats?.current_streak ?? 0,
      });

      setActivities(acts || []);

      // detect new achievements
      if (prevAchievements.length) {
        ach.forEach((a) => {
          const prev = prevAchievements.find((p) => p.title === a.title);
          if (a.completed && !prev?.completed) {
            triggerAchievement(a.title);
          }
        });
      }

      setPrevAchievements(ach);
      setAchievements(ach);
    } catch (err) {
      console.log("Profile error", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* -------------------- CONFETTI -------------------- */
  const triggerAchievement = (title) => {
    setConfetti(true);

    Toast.show({
      type: "success",
      text1: "Achievement Unlocked 🎉",
      text2: title,
    });

    setTimeout(() => setConfetti(false), 3000);
  };

  /* -------------------- IMAGE PICKER -------------------- */
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      try {
        const path = await uploadProfileImg({ uri });

        // force refresh user from backend
        await loadUser();

        updateUser({
          profile_image: path,
        });

        Toast.show({
          type: "success",
          text1: "Profile picture updated",
        });
      } catch (e) {
        console.log(e);
      }
    }
  };

  /* -------------------- MOOD SUMMARY -------------------- */
  const getMoodSummary = () => {
    if (!activities.length) return "Start exploring to build your mood profile";

    const liked = activities.filter((a) => a.is_liked);

    const outdoor = liked.filter(
      (a) =>
        a.category?.toLowerCase().includes("park") ||
        a.category?.toLowerCase().includes("outdoor"),
    ).length;

    const indoor = liked.length - outdoor;

    const preference = outdoor > indoor ? "outdoor" : "indoor";

    return `You tend to enjoy ${preference} experience and engage most when exploring new places.`;
  };

  /* -------------------- SAVE NAME -------------------- */
  const saveName = async () => {
    try {
      await updateUserProfile({ name });

      updateUser({ name });
      setEditModal(false);

      Toast.show({
        type: "success",
        text1: "Profile updated",
      });
    } catch (e) {
      console.log(e.response?.data || e.message);
    }
  };

  /* -------------------- STATS -------------------- */
  const totalSyncs = useCountUp(stats.total_syncs);
  const streak = useCountUp(stats.current_streak);
  const achievementsCount = useCountUp(
    achievements.filter((a) => a.completed).length,
  );
  const recommendationsCount = useCountUp(activities.length);

  const imageUri = getProfileImage();

  /* -------------------- MENU ACTIONS -------------------- */
  const handleMenu = (type) => {
    if (type === "edit") setEditModal(true);

    if (type === "accounts") {
      navigation.navigate("Accounts");
    }
    if (type === "privacy") {
      navigation.navigate("Privacy");
    }
    if (type === "delete") {
      Alert.alert("Delete Account", "Not implemented yet");
    }
  };

  /* -------------------- UI -------------------- */
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#9b5de5" />
        </View>
      );
    }

    return (
      <>
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
              maskElement={<Text style={styles.headerTitle}>Profile</Text>}
            >
              <LinearGradient
                colors={["#b36bff", "#ff4fa3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.headerTitle, { opacity: 0 }]}>
                  Profile
                </Text>
              </LinearGradient>
            </MaskedView>
          </View>

          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subtitle}>
          Manage your account and view achievements
        </Text>

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
        </View>

        {confetti && <ConfettiCannon count={80} origin={{ x: 200, y: 0 }} />}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* PROFILE CARD */}
          <Animated.View
            style={{
              opacity: fade,
              transform: [{ scale }],
            }}
          >
            <BlurView intensity={60} tint="light" style={styles.profileCard}>
              {/* AVATAR */}
              <View style={styles.avatarWrap}>
                {user.profile_image ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.avatar}
                    resizeMode="cover"
                    onError={(e) => console.log("IMAGE ERROR:", e.nativeEvent)}
                    onLoad={(e) => console.log("IMAGE LOADED:", imageUri)}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <LinearGradient
                      colors={["#b36bff", "#ff4fa3"]}
                      style={styles.avatar}
                    >
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={40}
                        color="#fff"
                      />
                    </LinearGradient>
                  </View>
                )}

                <TouchableOpacity style={styles.camera} onPress={pickImage}>
                  <MaterialCommunityIcons
                    name="camera"
                    size={16}
                    color="#000"
                  />
                </TouchableOpacity>
              </View>

              {/* NAME */}

              <TouchableOpacity onPress={() => setEditModal(true)}>
                <Text style={styles.name}>
                  {user?.name || "User"}{" "}
                  <MaterialCommunityIcons name="pencil" size={14} />
                </Text>
              </TouchableOpacity>

              <Text style={styles.email}>{user?.email}</Text>
              <Text style={styles.member}>Member since January 2026</Text>

              {/* STATS */}
              <View style={styles.statsGrid}>
                <Stat
                  label="Total Syncs"
                  value={totalSyncs}
                  icon="pulse"
                  color="#9b5de5"
                />
                <Stat
                  label="Days Active"
                  value={streak}
                  icon="calendar"
                  color="#3a86ff"
                />
                <Stat
                  label="Achievement"
                  value={achievementsCount}
                  icon="trophy-outline"
                  color="#06d6a0"
                />
                <Stat
                  label="Recommendations"
                  value={recommendationsCount}
                  icon="trending-up"
                  color="#ef476f"
                />
              </View>
            </BlurView>
          </Animated.View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Your Mood Style</Text>

            <Text style={styles.summaryText}>{getMoodSummary()}</Text>
          </View>

          {/* ACHIEVEMENTS */}
          <View style={styles.section}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={26}
                  color="#f4c430"
                />
                <Text style={styles.sectionTitle}>Achievements</Text>
              </View>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={achievements}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => <AchievementBadge item={item} />}
            />

            {/* RECENT ACTIVITY */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="history"
                  size={26}
                  color="#3a86ff"
                />
                <Text style={styles.sectionTitle}>Recent Activity</Text>
              </View>

              {activities.length === 0 ? (
                <Text style={styles.emptyText}>No activity yet</Text>
              ) : (
                activities.slice(0, 5).map((item, i) => (
                  <View key={i} style={styles.activityRow}>
                    <View style={styles.activityIcon}>
                      <MaterialCommunityIcons
                        name="map-marker"
                        size={20}
                        color="#fff"
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.activityTitle}>
                        {item.name?.trim() || "Activity"}
                      </Text>

                      <Text style={styles.activitySubtitle}>
                        {shortenLocation(item.location)}
                      </Text>
                    </View>

                    {item.is_liked && (
                      <MaterialCommunityIcons
                        name="heart"
                        size={18}
                        color="#ef476f"
                      />
                    )}
                  </View>
                ))
              )}
            </View>

            {/* MENU */}
            <View style={styles.menu}>
              <MenuItem
                text="Edit Profile Information"
                onPress={() => handleMenu("edit")}
              />
              <MenuItem
                text="Connected Accounts"
                onPress={() => handleMenu("accounts")}
              />
              <MenuItem
                text="Privacy & Data"
                onPress={() => handleMenu("privacy")}
              />
              <MenuItem
                text="Delete Account"
                danger
                onPress={() => handleMenu("delete")}
              />
            </View>

            {/* <View style={styles.achievementCard}>
              {achievements.map((a, i) => (
                <Achievement key={i} {...a} />
              ))}
              <Achievement
                title="First Sync"
                desc="Completed your first mood sync"
                icon="target"
                color="#ff4d6d"
                completed
              />

              <Achievement
                title="Self Aware"
                desc="Completed 20 mood syncs"
                icon="brain"
                color="#9b5de5"
              />

              <Achievement
                title="Consistency King"
                desc="Maintained a 30-day streak"
                icon="crown"
                color="#f4c430"
              />

              <Achievement
                title="Explorer"
                desc="Tried 15 activities"
                icon="star-outline"
                color="#ff9f1c"
              />
            </View> */}
          </View>
        </ScrollView>

        {/* EDIT MODAL */}
        <Modal visible={editModal} transparent animationType="slide">
          <View style={styles.modal}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}> Edit Profile</Text>

              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Your name"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>
      <Toast />
      <AIAssistant />
      {/* <BottomNav navigation={navigation} active={"profile"} /> */}
    </View>
  );
}

/* -------------------- COMPONENTS -------------------- */
const Stat = ({ label, value, icon, color }) => (
  <View style={[styles.statBox, { backgroundColor: color + "20" }]}>
    <MaterialCommunityIcons name={icon} size={30} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AchievementBadge = ({ item }) => {
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  const config = {
    "First Sync": { icon: "rocket-launch", color: "#ff6b6b" },
    "Getting Started": { icon: "flag-checkered", color: "#4cc9f0" },
    "Self Aware": { icon: "brain", color: "#9b5de5" },
    "Consistency King": { icon: "fire", color: "#f4c430" },
    "Weekly Warrior": { icon: "calendar-star", color: "#3a86ff" },
    "Activity Explorer": { icon: "compass", color: "#00bcd4" },
    Legend: { icon: "crown", color: "#ff9f1c" },
  };

  const { icon, color } = config[item.title] || {
    icon: "trophy",
    color: "#999",
  };

  return (
    <Animated.View
      style={[
        styles.achievementCard,
        {
          transform: [{ scale }],
          opacity: item.completed ? 1 : 0.4,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + "20" }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.achievementTitle}>{item.title}</Text>
        <Text style={styles.achievementDesc}>{item.desc}</Text>
      </View>

      {item.completed && (
        <MaterialCommunityIcons name="check-circle" size={30} color="#06d6a0" />
      )}

      {!item.completed && (
        <View style={styles.lockedBar}>
          <Text style={styles.lockedText}>Locked</Text>
        </View>
      )}
    </Animated.View>
  );
};

const Achievement = ({ title, desc, icon, color, completed }) => (
  <View style={styles.achievementRow}>
    <MaterialCommunityIcons name={icon} size={22} color={color} />

    <View style={{ flex: 1, marginLeft: 10 }}>
      <Text style={styles.achievementTitle}>{title}</Text>
      <Text style={styles.achievementDesc}>{desc}</Text>
    </View>

    {completed && (
      <MaterialCommunityIcons name="check-circle" size={20} color="#34c759" />
    )}
  </View>
);

const MenuItem = ({ text, danger, onPress }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Text style={[styles.menuText, danger && { color: "red" }]}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e9eef6",
  },

  content: {
    flex: 1,
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
    paddingBottom: 120,
  },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 20,
    marginTop: 10,
    alignItems: "center",
    elevation: 4,
  },

  avatarWrap: {
    marginBottom: 10,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  camera: {
    position: "absolute",
    right: -5,
    bottom: 0,
    backgroundColor: "#00bcd4",
    padding: 6,
    borderRadius: 20,
  },

  name: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },

  email: {
    color: "#666",
    marginTop: 4,
  },

  member: {
    color: "#999",
    marginTop: 2,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    justifyContent: "space-between",
  },

  statBox: {
    width: "48%",
    backgroundColor: "#d9faff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },

  statLabel: {
    color: "#555",
    fontSize: 13,
    marginTop: 2,
  },

  section: {
    marginTop: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },

  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3a86ff",
    justifyContent: "center",
    alignItems: "center",
  },

  activityTitle: {
    fontWeight: "600",
    fontSize: 14,
  },

  activitySubtitle: {
    fontSize: 12,
    color: "#777",
  },

  achievementCard: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 24,
    marginRight: 14,
    alignItems: "center",
    width: 320,
    minHeight: 100,
    elevation: 5,
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  achievementTitle: {
    fontWeight: "700",
    fontSize: 16,
  },

  achievementDesc: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },

  lockedBar: {
    marginTop: 6,
    backgroundColor: "#eee",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
  },

  lockedText: {
    fontSize: 11,
    color: "#999",
  },

  emptyText: {
    color: "#999",
    marginTop: 10,
  },

  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginTop: 15,
    elevation: 3,
  },

  summaryTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },

  summaryText: {
    color: "#555",
    lineHeight: 18,
  },

  menu: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 16,
    padding: 20,
  },

  menuItem: {
    padding: 14,
  },

  menuText: {
    fontSize: 15,
    color: "#333",
  },

  modal: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
  },

  modalCard: {
    width: "85%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },

  saveBtn: {
    backgroundColor: "#00bcd4",
    marginTop: 15,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
