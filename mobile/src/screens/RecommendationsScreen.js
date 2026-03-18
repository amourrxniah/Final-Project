import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import * as Location from "expo-location";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

import AIAssistant from "../components/AIAssistant/AIAssistant";
import BottomNav from "../components/BottomNav";
import SkeletonCard from "../components/SkeletonCard";
import { useFavouriteAnimation } from "../components/useFavouriteAnimation";
import { 
  getRecommendations,
  getUserActivities,
  addFavourite,
  removeFavourite,
  sendActivityFeedback,
  logActivityOpen
 } from "../components/api";

/* -------------------- CONFIG -------------------- */
const ITEMS_PER_PAGE = 5;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* -------------------- CATEGORY ICONS -------------------- */
const CATEGORY_ICON_MAP = [
  { match: ["museum", "gallery", "heritage", "arts_centre"], icon: "bank" },
  { match: ["cinema", "theatre", "entertainment"], icon: "movie-open" },
  { match: ["park", "nature"], icon: "tree" },
  { match: ["fitness", "sport", "gym"], icon: "dumbbell" },
  { match: ["restaurant", "cafe", "bar"], icon: "silverware-fork-knife" },
  { match: ["shopping", "commercial", "mall"], icon: "shopping" },
];

const getCategoryIcon = (categories = []) => {
  const joined = categories.join(" ").toLowerCase();
  const found = CATEGORY_ICON_MAP.find((e) =>
    e.match.some((k) => joined.includes(k)),
  );
  return found ? found.icon : "map-marker";
};

const getTagFromCategories = (categories = []) => {
  const joined = categories.join(" ").toLowerCase();

  if (joined.includes("park") || joined.includes("nature")) {
    return { label: "Relaxing", icon: "leaf-outline" };
  }

  if (joined.includes("museum") || joined.includes("gallery")) {
    return { label: "Cultural", icon: "school-outline" };
  }

  if (joined.includes("cinema")) {
    return { label: "Entertainment", icon: "film-outline" };
  }

  if (
    joined.includes("cafe") ||
    joined.includes("restaurant") ||
    joined.includes("bar")
  ) {
    return { label: "Social", icon: "people-outline" };
  }

  if (joined.includes("fitness") || joined.includes("sport")) {
    return { label: "Active", icon: "fitness-outline" };
  }

  return { label: "Nearby", icon: "location-outline" };
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "morning";
  if (hour < 16) return "afternoon";
  if (hour < 20) return "evening";
  return "night";
};

export default function RecommendationsScreen({ route, navigation }) {
  const { mood, weather } = route.params;

  /* --------------- STATE --------------- */
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  const [feedback, setFeedback] = useState({});
  const [favourites, setFavourites] = useState({});

  const [sortOpen, setSortOpen] = useState(false);
  const [sortMode, setSortMode] = useState("relevance");
  
  const [undoItem, setUndoItem] = useState(null);

  const heartRefs = useRef({});
  const favouritesTargetRef = useRef(null);

  const { animateToTarget, FlyingHeart, bookmarkPulse } =
    useFavouriteAnimation();

  const animatedValues = useRef([]);

  /* --------------- INITIAL LOAD --------------- */
  useEffect(() => {
    loadRecommendations();
    loadUserState();
  }, []);

  useEffect(() => {
    setVisibleCount(5);
    const t = setTimeout(() => setVisibleCount(ITEMS_PER_PAGE), 250);
    return () => clearTimeout(t);
  }, [page]);

  /* -------------------- LOAD RECOMMENDATIONS --------------------*/
  const loadRecommendations = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return setLoading(false);

      const { coords } = await Location.getCurrentPositionAsync();
      const timeOfDay = getTimeOfDay();

      const data = await getRecommendations({
        mood,
        weather: weather?.condition || "",
        timeOfDay,
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      
      if (!Array.isArray(data)) return setLoading(false);

      const mapped = data.map((item) => ({
        ...item,
        distanceNum: item.distance || 0,
        distance: item.distance 
          ? (item.distance * 0.621371).toFixed(1) 
          : "N/A",
      }));

      animatedValues.current = mapped.map(() => new Animated.Value(0));
      
      setActivities(mapped);
      setLoading(false);

      requestAnimationFrame(() => {
        Animated.stagger(
          80,
          animatedValues.current.map((val) =>
            Animated.timing(val, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
          ),
        ).start();
      });

    } catch (err) {
      console.log("Recommendation load error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- LOAD USER STATE --------------------*/
  const loadUserState = async () => {
    try {
      const data = await getUserActivities();
      
      const favMap = {};
      const fbMap = {};

      data.forEach((a) => {
        if (a.is_favourite) favMap[a.id] = true;
        if (a.is_helpful) fbMap[a.id] = "up";
        if (a.not_for_me) fbMap[a.id] = "down";
      });

      setFavourites(favMap);
      setFeedback(fbMap);

    } catch (err) {
      console.log("Failed loading stored preferences", err);
    }
  };

  /* -------------------- FAVOURITES --------------------*/
  const toggleFavourite = async (item) => {
    const isAdding = !favourites[item.id];

    //updating
    setFavourites((prev) => ({ ...prev, [item.id]: isAdding }));

    try {
      if (isAdding) {
        // animate heart to bookmark
        heartRefs.current[item.id].measureInWindow((sx, sy, sw, sh) => {
          favouritesTargetRef.current.measureInWindow((ex, ey, ew, eh) => {
            animateToTarget(
              { x: sx + sw / 2 - 15, y: sy + sh / 2 - 15 },
              { x: ex + ew / 2 - 15, y: ey + eh / 2 - 15 },
            );
          });
        });

        await addFavourite(item.id);

        setUndoItem(item);

        //auto hide undo after 5 seconds
        setTimeout(() => setUndoItem(null), 5000);
      } else {
        await removeFavourite(item.id);
      }
    } catch (err) {
      console.log("Favourite failed", err);

      //revert if failed
      setFavourites((prev) => ({ ...prev, [item.id]: !isAdding }));
    }
  };

  const removeFavouriteFromDB = async (id) => {
    try {
      await removeFavourite(id);
    } catch (err) {
      console.log("Undo failed", err);
    }
  };

  /* -------------------- FEEDBACK --------------------*/
  const handleFeedback = async (activityId, type) => {
    const current = feedback[activityId];
    const newValue = current === type ? null : type;

    setFeedback((prev) => ({
      ...prev,
      [activityId]: newValue,
    }));

    try {
      await sendActivityFeedback(activityId, type);

    } catch (err) {
      console.log("Feedback failed", err);

      //revert on error
      setFeedback((prev) => ({
        ...prev,
        [activityId]: current,
      }));
    }
  };

  /* --------------- OPEN ACTIVITY --------------- */
  const openActivity = async (activity, rank) => {
    try {
      await logActivityOpen(activity.id);
    } catch (err) {
      console.log("Log error", err);
    }
      navigation.navigate("ActivityDetails", { 
        activity,
        mood,
        weather: weather?.condition,
        rank
      });
  };

  /* --------------- SORTING --------------- */
  const sortedActivities = Array.isArray(activities)
    ? [...activities].sort((a, b) => {
        if (sortMode === "distance") {
          return (a?.distanceNum ?? 0) - (b?.distanceNum ?? 0);
        } else {
          return (b?.score ?? 0) - (a?.score ?? 0);
        }
      })
    : [];

  const totalPages = Math.ceil(sortedActivities.length / ITEMS_PER_PAGE);

  const currentItems = sortedActivities
    .slice(page * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE + ITEMS_PER_PAGE)
    .slice(0, visibleCount);

  const changePage = (next) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPage(next);
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
            <MaterialCommunityIcons name="arrow-left" size={30} />
          </TouchableOpacity>

          <MaskedView
            maskElement={<Text style={styles.title}>Your Recommendations</Text>}
          >
            <LinearGradient
              colors={["#b36bff", "#ff4fa3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.title, { opacity: 0 }]}>
                Your Recommendations{" "}
              </Text>
            </LinearGradient>
          </MaskedView>
        </View>

        {/* INFO */}
        <LinearGradient colors={["#b36bff", "#ff4fa3"]} style={styles.infoCard}>
          <Text style={styles.infoText}>
            We've found <Text style={styles.infoBold}>{activities.length}</Text>{" "}
            activities that match you perfectly. Tailored to your{" "}
            <Text style={styles.infoBold}>{mood}</Text> mood and{" "}
            <Text style={styles.infoBold}>{weather?.condition}</Text>.
          </Text>
        </LinearGradient>

        {/* SOFT TOGGLE */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by:</Text>

          <TouchableOpacity
            style={styles.sortDropDown}
            onPress={() => setSortOpen(!sortOpen)}
            activeOpacity={0.9}
          >
            <Text style={styles.sortDropdownText}>
              {sortMode === "relevance" ? "Relevance" : "Distance"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#6b5cff" />
          </TouchableOpacity>

          {sortOpen && (
            <View style={styles.sortMenu}>
              <TouchableOpacity
                style={[styles.sortOption, styles.sortOptionDivider]}
                onPress={() => {
                  setSortMode("relevance");
                  setSortOpen(false);
                  setPage(0);
                }}
              >
                <Text style={styles.sortOptionText}>Relevance</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => {
                  setSortMode("distance");
                  setSortOpen(false);
                  setPage(0);
                }}
              >
                <Text style={styles.sortOptionText}>Distance</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* CONTENT */}
        {loading ? (
          [1, 2, 3].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {currentItems.map((item, index) => {
              const rank = page * ITEMS_PER_PAGE + index + 1;
              const tag = getTagFromCategories(item.category_names || []);
              const state = feedback[item.id];

              const animatedStyle = {
                opacity: animatedValues.current[index] || 1,
                transform: [
                  {
                    translateY:
                      animatedValues.current[index]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }) || 0,
                  }
                ]
              };

              return (
                <View key={item.id} style={styles.cardWrapper}>
                  <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.9}
                    onPress={() => openActivity(item, rank)}
                  >
                    {/* RANK */}
                    <View style={styles.rankCircle}>
                      <Text style={styles.rankText}>{rank}</Text>
                    </View>

                    {/* HEART */}
                    <TouchableOpacity
                      ref={(ref) => (heartRefs.current[item.id] = ref)}
                      style={styles.heart}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavourite(item);
                      }}
                    >
                      <MaterialCommunityIcons
                        name={favourites[item.id] ? "heart" : "heart-outline"}
                        size={26}
                        color={favourites[item.id] ? "#ff4fa3" : "#bbb"}
                      />
                    </TouchableOpacity>

                    <View style={styles.row}>
                      <View style={styles.iconCircle}>
                        <MaterialCommunityIcons
                          name={getCategoryIcon(item.category_names)}
                          size={26}
                          color="#6b5cff"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{item.title}</Text>
                        <Text style={styles.desc}>{item.subtitle}</Text>

                        <View style={styles.metaRow}>
                          <Text style={styles.meta}>
                            📍 {item.distance} miles
                          </Text>

                          <View style={styles.tagPill}>
                            <Ionicons
                              name={tag.icon}
                              size={16}
                              color="#6b5cff"
                            />
                            <Text style={styles.tagText}>{tag.label}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* FEEDBACK */}
                    <View style={styles.feedback}>
                      <TouchableOpacity
                        style={[
                          styles.feedbackBtn,
                          state === "up" && styles.activeBtn,
                        ]}
                        onPress={() => handleFeedback(item.id, "up")}
                      >
                        <MaterialCommunityIcons
                          name={
                            state === "up" ? "thumb-up" : "thumb-up-outline"
                          }
                          size={20}
                        />
                        <Text>Like</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.feedbackBtn,
                          state === "down" && styles.activeBtn,
                        ]}
                        onPress={() => handleFeedback(item.id, "down")}
                      >
                        <MaterialCommunityIcons
                          name={
                            state === "down"
                              ? "thumb-down"
                              : "thumb-down-outline"
                          }
                          size={20}
                        />
                        <Text>Dislike</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* PAGINATION */}
            {totalPages > 1 && (
              <View style={styles.pagination}>
                {page > 0 ? (
                  <TouchableOpacity
                    onPress={() => changePage(page - 1)}
                    style={styles.pageBtnWrap}
                    activeOpacity={1}
                  >
                    <Text style={styles.pageBtn}>Previous</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.pageBtnWrap} />
                )}

                <Text style={styles.pageIndicator}>
                  Page {page + 1} / {totalPages}
                </Text>

                {page < totalPages - 1 ? (
                  <TouchableOpacity
                    onPress={() => changePage(page + 1)}
                    style={styles.pageBtnWrap}
                    activeOpacity={1}
                  >
                    <Text style={styles.pageBtn}>Next</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.pageBtnWrap} />
                )}
              </View>
            )}
          </ScrollView>
        )}

        {/* AI ASSISTANT */}
        <AIAssistant mood={mood} />
      </View>

      <FlyingHeart />

      {undoItem && (
        <View style={styles.undoContainer}>
          <View style={styles.undoTextWrap}>
            <Text
              style={styles.undoText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Added "{undoItem.title}" to favourites
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              setFavourites((prev) => ({ ...prev, [undoItem.id]: false }));
              removeFavouriteFromDB(undoItem.id);
              setUndoItem(null);
            }}
          >
            <Text style={styles.undoBtn}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomNav
        navigation={navigation}
        active="mood"
        favouriteRef={favouritesTargetRef}
        bookmarkPulse={bookmarkPulse}
      />
    </View>
  );
}

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
    marginBottom: 20,
  },

  back: {
    width: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 6,
  },

  infoCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },

  infoText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },

  infoBold: {
    fontWeight: "800",
  },

  sortRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    zIndex: 10,
  },

  sortLabel: {
    fontWeight: "600",
  },

  sortDropDown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#efe9ff",
  },

  sortDropdownText: {
    fontWeight: "600",
    color: "#6b5cff",
  },

  sortMenu: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 6,
    padding: 6,
  },

  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  sortOptionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },

  sortOptionText: {
    fontWeight: "600",
  },

  scrollContent: {
    paddingHorizontal: 6,
    paddingBottom: 90,
  },

  loadingText: {
    marginTop: 10,
    textAlign: "center",
    color: "#555",
  },

  cardWrapper: {
    marginBottom: 5,
    paddingLeft: 12,
    paddingTop: 22,
  },

  flyingHeart: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 999,
  },

  undoContainer: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 9999,
  },

  undoTextWrap: {
    flex: 1,
    marginRight: 12,
  },

  undoText: {
    color: "#fff",
    fontWeight: "600",
  },

  undoBtn: {
    color: "#ff4fa3",
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },

  rankCircle: {
    position: "absolute",
    top: -18,
    left: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  rankText: {
    fontWeight: "700",
    color: "#555",
  },

  heart: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#efe9ff",
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  desc: {
    color: "#666",
    marginVertical: 6,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  meta: {
    color: "#6b5cff",
  },

  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: "#efe9ff",
  },

  tagText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b5cff",
  },

  feedback: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },

  feedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
  },

  activeBtn: {
    backgroundColor: "#dcd2ff",
  },

  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 8,
  },

  pageBtnWrap: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 12,
  },

  pageBtn: {
    fontSize: 18,
    color: "#6b5cff",
    fontWeight: "600",
  },

  pageIndicator: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 8,
    color: "#555",
  },
});
