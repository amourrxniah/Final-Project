import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

import AIAssistant from "../components/AIAssistant/AIAssistant";
import { useFocusEffect } from "@react-navigation/native";
import { getUserActivities, searchActivities } from "../components/api";

const { width } = Dimensions.get("window");

/* ------------------- DISTANCE ------------------- */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === null ||
    lon1 === null ||
    lat2 === null ||
    lon2 === null ||
    lat1 === undefined ||
    lon1 === undefined ||
    lat2 === undefined ||
    lon2 === undefined
  )
    return null;

  const R = 6371;
  const dlat = ((lat2 - lat1) * Math.PI) / 180;
  const dlon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dlon / 2) ** 2;

  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return isNaN(dist) ? null : dist.toFixed(1);
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
    "catering.restaurant": {
      icon: "silverware-variant",
      color: "#ff7a18",
      bg: "#fff3e8",
    },
    "catering.cafe": {
      icon: "coffee",
      color: "#6f4e37",
      bg: "#f5ebe0",
    },
    "entertainment.cinema": {
      icon: "movie-open",
      color: "#6366f1",
      bg: "#eef2ff",
    },
    "entertainment.museum": {
      icon: "bank",
      color: "#0ea5e9",
      bg: "#e0f2fe",
    },
    "leisure.park": {
      icon: "tree",
      color: "#22c55e",
      bg: "#ecfdf5",
    },
    "sport.fitness": {
      icon: "dumbbell",
      color: "#ef4444",
      bg: "#fee2e2",
    },
  };

  for (let c of cats) {
    if (map[c]) return map[c];
  }

  if (item.category && map[item.category]) return map[item.category];

  if (item.is_done)
    return {
      icon: "check-circle",
      color: "#22c55e",
      bg: "#ecfdf5",
    };
  if (item.is_favourite)
    return {
      icon: "heart-outline",
      color: "#ec4899",
      bg: "#fce7f3",
    };
  if (item.rating)
    return {
      icon: "star-outline",
      color: "#f59e0b",
      bg: "#fef3c7",
    };

  return {
    icon: "compass-outline",
    color: "#7c3aed",
    bg: "#f3e8ff",
  }; // clean default
};

const getMetaColor = (type) => {
  switch (type) {
    case "distance":
      return "#3b82f6"; // blue
    case "location":
      return "#10b981"; // green
    case "category":
      return "#f59e0b"; // amber
    default:
      return "#9ca3af";
  }
};

export default function MyActivitiesScreen({ navigation }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const [trending, setTrending] = useState([]);
  const [expandedSection, setExpandedSection] = useState(null);
  const [activeTab, setActiveTab] = useState("Total");
  const [history, setHistory] = useState([]);
  const [recentlyAdded, setRecentlyAdded] = useState([]);

  const [stats, setStats] = useState({
    favourites: 0,
    rated: 0,
    done: 0,
    total: 0,
  });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [tabWidth, setTabWidth] = useState(0);
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
        .slice(0, 20); // keep more internally

      setTrending(trendingSorted);

      // recently added = newest by created_at or id
      const addedSorted = [...list]
        .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
        .slice(0, 8);
      setRecentlyAdded(addedSorted);
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
          color="#fbbf24"
        />,
      );
    }
    return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
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

            // strict prefix
            if (title.startsWith(lower)) score += 10;

            // then word level prefix
            if (title.split(" ").some((w) => w.startsWith(lower))) score += 7;

            // fallback contains
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
  }, [search, activities]);

  const getTrendingLabel = (item) => {
    if (item.trending_score > 15) return "🔥 Very Popular";
    if (item.trending_score > 8) return "🔥 Trending";
    return "✨ Worth trying";
  };
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
    if (activeTab === "Total") {
      list = [...activities].sort((a, b) => getScore(b) - getScore(a));
    }

    if (activeTab === "Favourites") {
      list = list.filter((a) => a.is_favourite);
    }

    if (activeTab === "Ratings") {
      list = list.filter((a) => a.rating || a.is_liked || a.is_disliked);
    }

    if (activeTab === "History") {
      const activityHistory = activities.filter((a) => a?.is_done);

      const combined = [
        ...history,
        ...activityHistory,
        ...searchHistory.map((s) => ({ ...s, _isSearchEntry: true })),
      ];

      // remove duplicates
      const seen = new Set();
      list = combined.filter((item) => {
        const key = item?.id || item?.value || JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      //sort by recent
      list = list.sort(
        (a, b) =>
          new Date(b.opened_at || b.completed_at || b.time || 0) -
          new Date(a.opened_at || a.completed_at || b.time || 0),
      );
    }

    // apply search on top
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((a) => a?.title?.toLowerCase().includes(s));
    }

    const seen = new Set();
    list = list.filter((item) => {
      if (!item?.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return list;
  }, [activities, activeTab, search, history, searchHistory]);

  /* ------------------- CLICK HANDLER ------------------- */
  const handleSelect = (item) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSearch(item.title);
    setSuggestions([]);

    // store history
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== item.id);
      return [{ ...item, opened_at: new Date() }, ...filtered].slice(0, 20);
    });

    setSearchHistory((prev) =>
      [{ type: "search", value: item.title, time: new Date() }, ...prev].slice(
        0,
        20,
      ),
    );

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

  /* ------------------- TRENDING CARD ------------------- */
  const renderTrendingCard = (item) => {
    const iconData = getActivityIcon(item);
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.trendingCard}
        onPress={() => handleSelect(item)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#7c3aed", "#667eea"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.trendingGradient}
        >
          <View
            style={[
              styles.trendingIconContainer,
              { backgroundColor: iconData.bg },
            ]}
          >
            <MaterialCommunityIcons
              name={iconData.icon}
              size={24}
              color={iconData.color}
            />
          </View>

          <Text numberOfLines={2} style={styles.trendingTitle}>
            {item.title}
          </Text>
          <View style={styles.trendingMetaContainer}>
            <Text style={styles.trendingMeta}>{getTrendingLabel(item)}</Text>
            <View style={styles.trendingScoreBadge}>
              <MaterialCommunityIcons name="fire" size={12} color="#fff" />
              <Text style={styles.trendingScoreText}>
                {item.trending_score || 0}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  /* ------------------- RECENTLY ADDED CARD ------------------- */
  const renderRecentlyAddedCard = (item) => {
    const iconData = getActivityIcon(item);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.recentCard}
        onPress={() => handleSelect(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#fff", "#faf5ff"]}
          style={styles.recentGradient}
        >
          <View
            style={[
              styles.recentIconContainer,
              { backgroundColor: iconData.bg },
            ]}
          >
            <MaterialCommunityIcons
              name={iconData.icon}
              size={28}
              color={iconData.color}
            />
          </View>

          <View style={styles.recentContent}>
            <Text numberOfLines={2} style={styles.recentTitle}>
              {item.title}
            </Text>
            <Text style={styles.recentDate}>
              {new Date(item.created_at || Date.now()).toLocaleDateString()}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={18}
            color="#c4b5fd"
          />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  /* ------------------- ACTIVITY CARD ------------------- */
  const renderActivityCard = (item) => {
    const lat = item?.lat ?? item?.latitude;
    const lon = item?.lon ?? item?.longitude;

    const distance =
      userLocation && lat != null && lon != null
        ? getDistanceKm(
            Number(userLocation.latitude),
            Number(userLocation.longitude),
            Number(lat),
            Number(lon),
          )
        : null;

    // use formatted address shortener
    const addressLabel = item.city || item.suburb || item.formatted || null;

    const showHeart = activeTab !== "Ratings";
    const iconData = getActivityIcon(item);

    return (
      <Animated.View
        key={item.id}
        style={{
          opacity: fadeAnim,
          marginBottom: 12,
        }}
      >
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
        >
          {showHeart && item.is_favourite && (
            <View style={styles.heartBadge}>
              <MaterialCommunityIcons name="heart" size={24} color="#ff4d6d" />
            </View>
          )}

          <View style={styles.cardRow}>
            {/* LEFT ICON */}
            <View style={[styles.iconWrap, { backgroundColor: iconData.bg }]}>
              <MaterialCommunityIcons
                name={iconData.icon}
                size={24}
                color={iconData.color}
              />
            </View>

            {/* MAIN CONTENT */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>
                {item.subtitle || item.description || "No description"}
              </Text>

              <View style={styles.metaRow}>
                {distance && !isNaN(distance) && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons
                      name="map-marker-distance"
                      size={12}
                      color={getMetaColor("distance")}
                    />
                    <Text style={styles.metaText}>{distance} km away</Text>
                  </View>
                )}

                {addressLabel && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons
                      name="map-marker-outline"
                      size={12}
                      color={getMetaColor("location")}
                    />
                    <Text style={styles.metaText}>{addressLabel}</Text>
                  </View>
                )}

                {item.category_names?.[0] && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons
                      name="tag-outline"
                      size={12}
                      color={getMetaColor("category")}
                    />
                    <Text style={styles.metaText}>
                      {item.category_names[0].split(".").pop()}
                    </Text>
                  </View>
                )}
              </View>

              {activeTab !== "Favourites" && (
                <View style={styles.interactionContainer}>
                  <View style={styles.actionRow}>
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
                  </View>

                  {/* RATING BUBBLE */}
                  {typeof item.rating === "number" && (
                    <View style={styles.ratingRow}>
                      {renderStars(item.rating)}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
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
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              value={search}
              onFocus={() => setIsSearching(true)}
              onBlur={() => setIsSearching(false)}
              onChangeText={setSearch}
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearch("");
                  setSuggestions([]);
                }}
              >
                <MaterialCommunityIcons name="close-circle" size={20} />
              </TouchableOpacity>
            )}
          </View>

          {/* SEARCH SUGGESTIONS*/}
          {search.length > 0 && suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.suggestionText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* TRENDING SECTION */}
          {trending.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrap}>
                  <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
                  <Text style={styles.sectionSubtitle}>
                    Most popular based on activity
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    setExpandedSection(
                      expandedSection === "trending" ? null : "trending",
                    )
                  }
                >
                  <Text style={styles.seeAllText}>
                    {expandedSection === "trending" ? "Show less" : "See all"}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingScroll}
              >
                {(expandedSection === "trending"
                  ? trending
                  : trending.slice(0, 3)
                ).map(renderTrendingCard)}
              </ScrollView>
            </View>
          )}

          {/* RECENTLY ADDED SECTION*/}
          {recentlyAdded.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrap}>
                  <Text style={styles.sectionTitle}>🆕 Recently Added</Text>
                  <Text style={styles.sectionSubtitle}>
                    New places you haven't explored yet
                  </Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 240 }}
              >
                <View style={styles.recentGrid}>
                  {recentlyAdded.map(renderRecentlyAddedCard)}
                </View>
              </ScrollView>
            </View>
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
              iconGradient={["#ec4899", "#f43f5e"]}
            />

            <StatCard
              label="Ratings"
              value={stats.rated}
              icon="star-outline"
              iconGradient={["#fbbf24", "#f59e0b"]}
            />

            <StatCard
              label="History"
              value={stats.done}
              icon="history"
              iconGradient={["#10b981", "#34d399"]}
            />
          </View>

          {/* FILTER TABS */}
          <View
            style={styles.filterContainer}
            onLayout={(e) => {
              const width = e.nativeEvent.layout.width;
              setTabWidth(width / TABS.length);
            }}
          >
            <Animated.View
              style={[
                styles.slider,
                {
                  width: tabWidth,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: TABS.map((_, index) => index),
                        outputRange: TABS.map((_, index) => tabWidth * index),
                      }),
                    },
                  ],
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
            <View style={styles.activitiesContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                {displayActivities.slice(0, 40).map(renderActivityCard)}
              </ScrollView>
            </View>
          )}

          {/* MAP BELOW LIST */}
          {displayActivities.length > 0 && userLocation && (
            <View style={styles.MapContainer}>
              <MapView
                style={styles.bottomMap}
                initialRegion={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.08,
                  longitudeDelta: 0.08,
                }}
                showsUserLocation
                scrollEnabled={false} // disable 1 finger nav
                pitchEnabled={false}
                rotateEnabled={false}
                zoomEnabled={true} // 2 finger nav
              >
                {displayActivities.map((item) => {
                  const lat = item?.lat ?? item?.latitude;
                  const lon = item?.lon ?? item?.longitude;

                  if (lat == null || lon == null) return null;

                  return (
                    <Marker
                      key={item.id}
                      coordinate={{
                        latitude: Number(lat),
                        longitude: Number(lon),
                      }}
                      title={item.title}
                    />
                  );
                })}
              </MapView>
            </View>
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
    <Text style={styles.emptySubText}>
      Try searching or expore new activities
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
    paddingBottom: 40,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderRadius: 24,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#1e293b",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 10,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: -6,
    marginBottom: 7,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  sectionTitleWrap: {
    flexDirection: "column",
  },

  sectionContainer: {
    marginTop: 24,
  },

  seeAllText: {
    fontSize: 14,
    color: "#7c3aed",
    fontWeight: "600",
  },

  trendingScroll: {
    paddingRight: 17,
  },

  trendingCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },

  trendingGradient: {
    padding: 16,
    height: 140,
    justifyContent: "space-between",
  },

  trendingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  trendingTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 8,
  },

  trendingMetaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  trendingMeta: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "500",
  },

  trendingScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },

  trendingScoreText: {
    color: "#fff",
    fontSize: 10,
    marginLeft: 4,
    fontWeight: "600",
  },

  recentGrid: {
    gap: 10,
  },

  recentCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  recentGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },

  recentIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
  },

  recentContent: {
    flex: 1,
  },

  recentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },

  recentDate: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },

  suggestionsBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginTop: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },

  suggestionText: {
    fontSize: 14,
    color: "#1e293b",
  },

  arrowLeft: {
    padding: 4,
  },

  arrowRight: {
    padding: 4,
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
    top: 4,
    bottom: 4,
    backgroundColor: "#fff",
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eef1f5",
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
    alignItems: "center",
    justifyContent: "center",
  },

  activitiesContainer: {
    maxHeight: 420,
    marginBottom: 12,
  },

  cardContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },

  cardDesc: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 13,
  },

  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  distanceText: {
    fontSize: 11,
    color: "#94a3b8",
  },

  heartBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },

  metaText: {
    color: "#555",
    fontSize: 11,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "48%",
  },

  summaryRow: {
    alignItems: "flex-end",
  },

  interactionContainer: {
    marginTop: 10,
    gap: 10,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  ratingRow: {
    marginTop: 2,
  },

  MapContainer: {
    height: 240,
    marginTop: 10,
    marginBottom: 40,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
  },

  bottomMap: {
    width: "100%",
    height: "100%",
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 15,
    textAlign: "center",
  },

  emptySubText: {
    color: "#bbb",
    fontSize: 13,
    marginTop: 6,
  },
});
