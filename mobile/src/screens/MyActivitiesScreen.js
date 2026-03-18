import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import AIAssistant from "../components/AIAssistant/AIAssistant";
import BottomNav from "../components/BottomNav";
import axios from "axios";
import { useFocusEffect } from "@react-navigation/native";

const BACKEND_URL = "https://hatable-dana-divertedly.ngrok-free.dev";

export default function MyActivitiesScreen({ navigation }) {
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    favourites: 0,
    liked: 0,
    disliked: 0,
    done: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Favourites");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const TABS = ["Favourites", "Ratings", "History", "Total"];

  useFocusEffect(
    React.useCallback(() => {
        setLoading(true);
      fetchData();
    }, []),
  );

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.get(`${BACKEND_URL}/activities/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("FULL RESPONSE", res.data);

      const activitiesData = res.data.activities || res.data;

      setActivities(activitiesData);

      setStats({
        favourites: activitiesData.filter((a) => a.is_favourite).length,
        liked: activitiesData.filter((a) => a.is_helpful).length,
        disliked: activitiesData.filter((a) => a.not_for_me).length,
        done: activitiesData.filter((a) => a.is_done).length,
        total: activitiesData.length,
      });
    } catch (err) {
      console.log("Featch error", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // filter logic
  const filteredActivities = useMemo(() => {
    let list = activities;

    if (activeTab === "Favourites") {
      list = list.filter((a) => a.is_favourite);
    }
    if (activeTab === "Ratings") {
      list = list.filter((a) => a.is_helpful || a.not_for_me || a.rating);
    }
    if (activeTab === "History") {
      list = list.filter((a) => a.is_done);
    }
    if (activeTab === "Total") {
      list = activities;
    }

    if (search.trim()) {
      list = list.filter((a) =>
        a.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return list;
  }, [activities, activeTab, search]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#9b5de5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
              maskElement={
                <Text style={styles.headerTitle}>My Activities</Text>
              }
            >
              <LinearGradient
                colors={["#b36bff", "#ff4fa3"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.headerTitle, { opacity: 0 }]}>
                  My Activities
                </Text>
              </LinearGradient>
            </MaskedView>
          </View>

          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subtitle}>
          Track your favourites, ratings, and completed activities
        </Text>

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* SEARCH */}
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={24} color="#aaa" />
            <TextInput
              placeholder="Search activities..."
              placeholderTextColor="#aaa"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* STATS */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Favourites"
              value={stats.favourites}
              icon="heart-outline"
              iconGradient={["#ff6b81", "#ff8fa3"]}
            />

            <StatCard
              label="Ratings"
              value={stats.liked + stats.disliked}
              icon="thumb-up-outline"
              iconGradient={["#ffb703", "#ffd166"]}
            />

            <StatCard
              label="History"
              value={stats.done}
              icon="check-circle-outline"
              iconGradient={["#38b000", "#70e000"]}
            />

            <StatCard
              label="Total"
              value={stats.total}
              icon="chart-bar"
              iconGradient={["#5e60ce", "#64dfdf"]}
            />
          </View>

          {/* FILTER TABS */}
          <View style={styles.filterContainer}>
            <Animated.View
              style={[
                styles.slider,
                {
                  left: slideAnim.interpolate({
                    inputRange: [0, 1, 2, 3],
                    outputRange: ["0%", "25%", "50%", "75%"],
                  }),
                },
              ]}
            />
            
            {TABS.map((tab, index) => (
              <TouchableOpacity
                key={tab}
                style={styles.filterTab}
                onPress={() => {
                  Animated.spring(slideAnim, {
                    toValue: index,
                    useNativeDriver: false,
                    friction: 7,
                    tension: 80,
                  }).start();

                  setActiveTab(tab);
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeTab === tab && styles.activeFilterText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ACTIVITY CARDS */}
          {filteredActivities.length === 0 ? (
            <EmptyState />
          ) : (
            filteredActivities.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardRow}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={28}
                    color="#6b3ce9"
                    style={{ marginRight: 14 }}
                  />

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.description}</Text>

                    <View style={styles.metaColumn}>
                      {item.location && (
                        <Text style={styles.metaText}>📍 {item.location} </Text>
                      )}
                      {item.duration && (
                        <Text style={styles.metaText}>⏱ {item.duration} </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      <AIAssistant />

      <BottomNav navigation={navigation} active="favourites" />
    </View>
  );
}

const StatCard = ({ icon, label, value, iconGradient }) => (
  <View style={styles.statCard}>
    <MaskedView
      maskElement={
        <MaterialCommunityIcons name={icon} size={30} color="#000" />
      }
    >
      <LinearGradient
        colors={iconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 30, height: 30 }}
      />
    </MaskedView>

    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <MaterialCommunityIcons
      name="check-circle-outline"
      size={50}
      color="#bbb"
    />
    <Text style={styles.emptyText}>
      Complete activities to track your progress here
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
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

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    borderRadius: 22,
    height: 45,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
  },

  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    marginTop: 20,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e3e3e3",
    elevation: 4,
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 8,
  },

  statLabel: {
    color: "#666",
    marginTop: 4,
    fontWeight: "600",
  },

  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#e5e5e5",
    borderRadius: 30,
    padding: 6,
    justifyContent: "space-between",
    marginBottom: 20,
  },

  slider: {
    position: "absolute",
    width: "27%",
    top: 6,
    bottom: 6,
    backgroundColor: "#fff",
    borderRadius: 25,
  },

  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },

  activeFilterTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },

  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },

  activeFilterText: {
    color: "#000",
  },

  tabsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },

  tab: {
    backgroundColor: "#e9ddff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  tabText: {
    color: "#6b3ce9",
    fontWeight: "600",
    fontSize: 13,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  cardDesc: {
    color: "#666",
    marginTop: 6,
  },

  metaColumn: {
    gap: 4,
    marginTop: 8,
  },

  metaText: {
    color: "#555",
    fontSize: 12,
  },
});
