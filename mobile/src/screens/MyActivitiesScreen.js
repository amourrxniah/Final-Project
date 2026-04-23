import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  FlatList,
} from "react-native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import AIAssistant from "../components/AIAssistant/AIAssistant";
import { useFocusEffect } from "@react-navigation/native";
import { getUserActivities, searchActivities } from "../components/api";
import * as Location from "expo-location";

/* ------------------- DISTANCE ------------------- */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371;
  const dlat = ((lat2 - lat1) * Math.PI) / 180;
  const dlon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dlon / 2) ** 2;

  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
};

/* ------------------- FUZZY SEARCH ------------------- */
const fuzzysearch = (a = "", b = "") => {
  if (!a || !b) return 999;

  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1,
            );
    }
  }
  return matrix[b.length][a.length];
};

/* ------------------- ICON ------------------- */
const getActivityIcon = (item) => {
  const cats = item.category_names || [];

  const map = {
    "catering.restaurant": "silverware-variant",
    "catering.cafe": "coffee",
    "entertainment.cinema": "movie-open",
    "entertainment.museum": "bank",
    "leisure.park": "tree",
    "sport.fitness": "dumbbell",
  };

  for (let c of cats) {
    if (map[c]) return map[c];
  }

  if (item.category && map[item.category]) return map[item.category];

  if (item.is_done) return "check-circle";
  if (item.is_favourite) return "heart-outline";
  if (item.rating) return "star-outline";
  // if (item.is_liked) return "thumb-up-outline";
  // if (item.is_disliked) return "thumb-down-outline";

  return "compass-outline"; // clean default
};

export default function MyActivitiesScreen({ navigation }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState(null);

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [activeTab, setActiveTab] = useState("Total");

  const [stats, setStats] = useState({
    favourites: 0,
    rated: 0,
    done: 0,
    total: 0,
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const TABS = ["Total", "Favourites", "Ratings", "History"];

  /* ------------------- GET LOCATION ------------------- */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
    })();
  }, []);

  /* ------------------- FETCH ------------------- */
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, []),
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const data = await getUserActivities();
      const list = Array.isArray(data) ? data : [];

      setActivities(list);
      updateStats(list);

      // trending = most interacted
      const trendingSorted = [...list]
        .sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0))
        .slice(0, 6);

      setTrending(trendingSorted);
    } catch (err) {
      console.log("Fetch error", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------- STATS ------------------- */
  const updateStats = (list) => {
    setStats({
      total: list.length,
      favourites: list.filter((a) => a?.is_favourite).length,
      rated: list.filter(
        (a) =>
          a?.is_liked ||
          a?.is_disliked ||
          (a?.rating !== null && a?.rating !== undefined),
      ).length,
      done: list.filter((a) => a?.is_done).length,
    });
  };

  const renderStars = (rating = 0) => {
    const stars = [];
    const rounded = Math.round(rating);

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <MaterialCommunityIcons
          key={i}
          name={i <= rounded ? "star" : "star-outline"}
          size={14}
          color="#ffb703"
        />,
      );
    }
    return <View style={{ flexDirection: "row" }}>{stars}</View>;
  };

  /* ------------------- RANK ------------------- */
  const getScore = (a) =>
    (a.is_done ? 3 : 0) +
    (a.is_favourite ? 2 : 0) +
    (a.is_liked ? 1 : 0) -
    (a.is_disliked ? 1 : 0) +
    (a.rating || 0);

  const getRank = (item) => {
    const sorted = [...activities].sort((a, b) => getScore(b) - getScore(a));
    return sorted.findIndex((a) => a.id === item.id) + 1;
  };

  /* ------------------- SEARCH ------------------- */
  useEffect(() => {
    const runSearch = async () => {
      if (!search.trim()) {
        setSuggestions([]);
        return;
      }
      const results = await searchActivities(search);
      setSuggestions(results || []);

      try {
        // try api search first
        const apiResults = await searchActivities(search);

        if (apiResults?.length > 0) {
          setSuggestions(apiResults);
          return;
        }

        // fallback fuzzy
        const lower = search.toLowerCase();
        const ranked = activities
          .map((a) => {
            const title = a.title.toLowerCase();
            let score = 0;

            if (title.startsWith(lower)) score += 5;
            if (title.includes(lower)) score += 3;

            const distance = fuzzysearch(lower, title);
            if (distance <= 2) score += 4;

            return { ...a, score };
          })
          .filter((a) => a.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8); // limit suggestions

        setSuggestions(ranked);
      } catch (err) {
        console.log("Search error", err.message);
      }
    };

    runSearch();
  }, [search]);

  /* ------------------- LIVE UPDATE HANDLER ------------------- */
  const updateActivityLocal = (updated) => {
    setActivities((prev) => {
      const updatedList = prev.map((a) =>
        a.id === updated.id ? { ...a, ...updated } : a,
      );
      updateStats(updatedList);
      return updatedList;
    });
  };

  /* ------------------- FILTER ------------------- */
  const displayActivities = useMemo(() => {
    let list = [...activities];

    // tab filter
    if (activeTab === "Favourites") list = list.filter((a) => a.is_favourite);

    if (activeTab === "Ratings")
      list = list.filter((a) => a.rating || a.is_liked || a.is_disliked);

    if (activeTab === "History") list = list.filter((a) => a.is_done);

    // apply search on top
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((a) => a.title.toLowerCase().includes(s));
    }

    // sorting
    return list.sort((a, b) => {
      //newest interaction top
      return new Date(b.completed_at || 0) - new Date(a.completed_at || 0);
    });
  }, [activities, activeTab, search]);

  /* ------------------- CLICK HANDLER ------------------- */
  const handleSelect = (item) => {
    setSearch(item.title);
    setSuggestions([]);

    navigation.push("ActivityDetails", {
      activity: {
        ...item,
        category_names: item.category_names || [],
      },
      onUpdate: updateActivityLocal,
      allActivities: activities,
      mood: null,
      weather: null,
      rank: getRank(item),
    });
  };

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
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
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
          {/* SEARCH SUGGESTIONS*/}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.suggestionText}>{item.title}</Text>

                  {index !== suggestions.length - 1 && (
                    <View style={styles.suggestionDivider} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {trending.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {trending.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.trendingCard}
                    onPress={() => handleSelect(item)}
                  >
                    <LinearGradient
                      colors={["#d3cce3", "#c9d6ff"]}
                      style={styles.trendingGradient}
                    >
                      <MaterialCommunityIcons
                        name={getActivityIcon(item)}
                        size={24}
                        color="#fff"
                      />

                      <Text style={styles.trendingCardText}>{item.title}</Text>

                      <Text style={{ fontSize: 10, color: "#fff" }}>
                        🔥 {Math.round(item.trending_score)}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* STATS */}
          <View style={styles.statsGrid}>
            <StatCard
              label="Total"
              value={stats.total}
              icon="chart-bar"
              iconGradient={["#5e60ce", "#64dfdf"]}
            />

            <StatCard
              label="Favourites"
              value={stats.favourites}
              icon="heart-outline"
              iconGradient={["#ff6b81", "#ff8fa3"]}
            />

            <StatCard
              label="Ratings"
              value={stats.rated}
              icon="star-outline"
              iconGradient={["#ffb703", "#ffd166"]}
            />

            <StatCard
              label="History"
              value={stats.done}
              icon="history"
              iconGradient={["#38b000", "#70e000"]}
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
                  setActiveTab(tab);

                  Animated.spring(slideAnim, {
                    toValue: index,
                    useNativeDriver: false,
                    friction: 7,
                    tension: 80,
                  }).start();
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
          {displayActivities.length === 0 ? (
            <EmptyState />
          ) : (
            displayActivities.map((item) => (
              <Animated.View
                key={item.id}
                style={{
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => handleSelect(item)}
                >
                  {activeTab === "Favourites" && item.is_favourite && (
                    <View style={styles.heartBadge}>
                      <MaterialCommunityIcons
                        name="heart"
                        size={24}
                        color="#ff4d6d"
                      />
                    </View>
                  )}

                  <View style={styles.cardRow}>
                    {/* LEFT ICON */}
                    <View style={styles.iconWrap}>
                      <MaterialCommunityIcons
                        name={getActivityIcon(item)}
                        size={28}
                        color="#6b3ce9"
                      />
                    </View>

                    {/* MAIN CONTENT */}
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDesc}>
                        {item.subtitle || item.description}
                      </Text>
                    </View>

                    {/* RIGHT SUMMARY */}
                    <View style={styles.summaryRow}>
                      {activeTab === "Favourites" ? (
                        <MaterialCommunityIcons
                          name="heart"
                          size={14}
                          color="#fff"
                        />
                      ) : (
                        <>
                          {/* RATING BUBBLE */}
                          {typeof item.rating === "number" &&
                            activeTab !== "Favourites" && (
                              <View style={styles.ratingPill}>
                                {renderStars(item.rating)}
                              </View>
                            )}

                          {/* LIKE / DISLIKE */}
                          {item.is_liked && (
                            <MaterialCommunityIcons
                              name="heart-circle"
                              size={18}
                              color="#ff4fa3"
                            />
                          )}

                          {item.is_disliked && (
                            <MaterialCommunityIcons
                              name="close-circle"
                              size={18}
                              color="#a0a0a0"
                            />
                          )}
                          {/* COMPLETED DATE */}
                          {item.is_done && item.completed_at && (
                            <MaterialCommunityIcons
                              name="check-circle"
                              size={18}
                              color="#6b5cff"
                            />
                          )}
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>
      <AIAssistant />
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

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 10,
  },

  trendingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  trendingControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  arrowLeft: {
    padding: 4,
  },

  arrowRight: {
    padding: 4,
  },

  trendingCard: {
    width: 140,
    height: 110,
    marginRight: 12,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#eee",
  },

  thumbnail: {
    flex: 1,
    justifyContent: "flex-end",
  },

  thumbnailImg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  thumbnailFallback: {
    flex: 1,
    backgroundColor: "#f3f0ff",
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnailOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  thumbnailTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    padding: 10,
  },

  trendingGradient: {
    padding: 14,
    height: 90,
    justifyContent: "space-between",
  },

  trendingCardText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 13,
  },

  suggestionsBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    elevation: 3,
  },

  suggestionItem: {
    paddingVertical: 8,
  },

  suggestionText: {
    fontSize: 14,
    color: "#333",
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
    width: "25%",
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 25,
    backgroundColor: "#f3f0ff",
    alignItems: "center",
    justifyContent: "center",
  },

  cardContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },

  cardDesc: {
    color: "#666",
    marginTop: 6,
  },

  heartBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },

  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  metaText: {
    color: "#555",
    fontSize: 8,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7e6",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },

  ratingText: {
    color: "#6b3ce9",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 3,
    marginBottom: 10,
  },

  suggestionItem: {
    paddingVertical: 10,
  },

  suggestionDivider: {
    height: 1,
    backgroundColor: "#eee",
  },
});
