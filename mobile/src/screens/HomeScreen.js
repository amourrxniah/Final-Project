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
  PanResponder,
  Easing,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";
import BottomNav from "../components/BottomNav";
import { useFocusEffect } from "@react-navigation/native";
import AIAssistant from "../components/AIAssistant/AIAssistant";
import {
  getCurrentUser,
  getMoodStats,
  getMoodTrend,
  getRecentActivity,
} from "../components/api";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/* -------------------- HOME SCREEN -------------------- */
export default function HomeScreen({ navigation }) {
  const [name, setName] = useState("User");
  const [stats, setStats] = useState({
    total_syncs: 0,
    current_streak: 0,
    most_common_mood: null,
  });

  const [trend, setTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [insight, setInsight] = useState("");

  const [loading, setLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [viewMode, setViewMode] = useState("live");

  /* -------------------- LOAD CORE DATA -------------------- */
  const loadCore = async () => {
    try {
      const [user, statsData, activityData] = await Promise.all([
        getCurrentUser(),
        getMoodStats(),
        getRecentActivity(),
      ]);

      setName(user.username || "User");
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
        value: Number(d.value) || 0,
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
        setLoading(false);
      };
      init();
    }, []),
  );

  /* -------------------- TREND MODE CHANGE -------------------- */
  useEffect(() => {
    loadTrend(viewMode);
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
          <View style={styles.profileIcon}>
            <MaterialCommunityIcons
              name="account-outline"
              size={50}
              color="#fff"
            />
          </View>
          <View>
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.name}>{name}</Text>
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

            <Text style={styles.cardTitle}>Mood Trend</Text>
            <View>
              <Text style={styles.chartHint}>
                Tap a point to see exact mood
              </Text>
            </View>
          </View>

          <SegmentedControl value={viewMode} onChange={setViewMode} />

          <View style={{ position: "relative" }}>
            <SmoothChart data={trend} viewMode={viewMode} />
            {/* <SmoothChart data={trend} viewMode={viewMode} /> */}

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

      <BottomNav navigation={navigation} active="home" />
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

/* -------------------- SMOOTH CURVED CHART -------------------- */
const SmoothChart = ({ data = [], viewMode }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [scale, setScale] = useState(1.2);

  const animProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const lastDistance = useRef(null);
  const scrollRef = useRef(null);

  /* ---------- ANIMATE LINE DRAW ---------- */
  useEffect(() => {
    animProgress.setValue(0);
    fadeAnim.setValue(0);

    Animated.parallel([
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
    ]).start();

    setSelectedIndex(null);
  }, [data]);

  /* ---------- POINT PULSE ANIMATION ---------- */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  /* ---------- AUTO SCROLL ---------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 250);

    return () => clearTimeout(timer);
  }, [data, scale]);

  /* ---------- EMPTY STATE ---------- */
  if (!data || !data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <MaterialCommunityIcons name="chart-line" size={40} color="#ddd" />
        <Text style={styles.emptyChartText}>No mood data yet.</Text>
      </View>
    );
  }

  /* ---------- DIMENSIONS ---------- */
  const chartHeight = 240;
  const yAxisWidth = 55;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 50;

  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const maxValue = 2;
  const stepY = graphHeight / maxValue;

  //each point gets fixed spacing
  const baseSpacing =
    viewMode === "live"
      ? 80
      : viewMode === "yesterday"
        ? 90
        : viewMode === "week"
          ? 120
          : 90; //daily default

  const pointSpacing = baseSpacing * scale;
  const chartWidth = paddingRight + (data.length - 1) * pointSpacing;

  /* ---------- SAFE POINTS ---------- */
  const points = data.map((d, i) => {
    const val =
      typeof d.value === "number" ? d.value : parseFloat(d.value) || 0;

    const safeVal = Math.max(0, Math.min(2, Math.round(val)));

    return {
      x: i * pointSpacing,
      y: paddingTop + (graphHeight - safeVal * stepY),
      label: d.time || d.day || "",
      value: safeVal,
      hasData: d.has_data !== false,
    };
  });

  /* ---------- CURVE GENERATION ---------- */
  const getBezierPath = (pts) => {
    if (!pts || pts.length < 2) return null;

    let path = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const xMid = (pts[i].x + pts[i + 1].x) / 2;

      path += ` C ${xMid} ${pts[i].y},
                ${xMid} ${pts[i + 1].y},
                ${pts[i + 1].x} ${pts[i + 1].y}`;
    }
    return path;
  };

  const curvePath = getBezierPath(points);

  //approximate total path length for stroke dash animation
  const pathLength = curvePath ? 1000 : 1;

  const strokeDash = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [pathLength, 0],
  });

  /* ---------- PINCH ZOOM ---------- */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_, gs) => gs.numberActiveTouches === 2,
      onMoveShouldSetPanResponder: (_, gs) => gs.numberActiveTouches === 2,

      onPanResponderMove: (e) => {
        const touches = e.nativeEvent.touches;

        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;

          const dist = Math.sqrt(dx * dx + dy * dy);

          if (lastDistance.current != null) {
            const scaleFactor = dist / lastDistance.current;
            setScale((prev) => Math.min(4, Math.max(0.8, prev * scaleFactor)));
          }

          lastDistance.current = dist;
        }
      },

      onPanResponderRelease: () => {
        lastDistance.current = null;
      },
    }),
  ).current;

  const moodLabels = ["Low", "Neutral", "High"];
  const moodColors = ["#ff4fa3", "#9b5de5", "#2ec4b6"];

  /* ---------- TAP SELECT ---------- */
  const handlePress = (e) => {
    const { locationX, locationY } = e.nativeEvent;

    let closest = null;
    let minDist = Infinity;

    points.forEach((p, i) => {
      const dist = Math.hypot(p.x - locationX, p.y - locationY);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    if (minDist < 25) {
      setSelectedIndex((prev) => (prev === closest ? null : closest));
    }
  };

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        {/* FIXED Y AXIS */}
        <Svg width={yAxisWidth} height={chartHeight}>
          {[0, 1, 2].map((v) => (
            <SvgText
              key={v}
              x={yAxisWidth - 8}
              y={paddingTop + graphHeight - v * stepY + 4}
              fontSize="11"
              fill={moodColors[v]}
              textAnchor="end"
              fontWeight="600"
            >
              {moodLabels[v]}
            </SvgText>
          ))}

          <Line
            x1={yAxisWidth}
            y1={paddingTop}
            x2={yAxisWidth}
            y2={chartHeight - paddingBottom}
            stroke="#ccc"
            strokeWidth="2"
          />
        </Svg>

        {/* SCROLLABLE GRAPH AREA */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          {...panResponder.panHandlers}
        >
          <Svg width={chartWidth} height={chartHeight} onPress={handlePress}>
            <Defs></Defs>
            {/* VERTICAL GRID LINES */}
            {points.map((p, i) => (
              <Line
                key={`v-${i}`}
                x1={p.x}
                y1={paddingTop}
                x2={p.x}
                y2={chartHeight - paddingBottom}
                stroke="#e8e8f0"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            ))}

            {/* HORIZONTAL GRID LINES */}
            {[0, 1, 2].map((v) => (
              <Line
                key={`h-${v}`}
                x1={0}
                y1={paddingTop + (graphHeight - v * stepY)}
                x2={chartWidth - paddingRight}
                y2={paddingTop + (graphHeight - v * stepY)}
                stroke="#e8e8f0"
                strokeWidth="1"
              />
            ))}

            {/* X AXIS */}
            <Line
              x1={0}
              y1={chartHeight - paddingBottom}
              x2={chartWidth}
              y2={chartHeight - paddingBottom}
              stroke="#ccc"
              strokeWidth="2"
            />

            {/* X AXIS LABELS (days) */}
            {points.map((p, i) => {
              const labelFrequency =
                viewMode === "live"
                  ? 1 //every point
                  : viewMode === "yesterday"
                    ? 1 //hourly labels
                    : viewMode === "week"
                      ? 1
                      : 5;

              //monthly = skip  labels to avoid crowding
              if (i % labelFrequency !== 0 && i !== points.length - 1)
                return null;

              return (
                <SvgText
                  key={`xlab-${i}`}
                  x={p.x}
                  y={chartHeight - paddingBottom + 18}
                  fontSize="10"
                  fill="#888"
                  textAnchor="middle"
                >
                  {p.label}
                </SvgText>
              );
            })}

            {/* VERTICAL HIGHLIGHT LINE on selected */}
            {selectedIndex !== null && points[selectedIndex] && (
              <Line
                x1={points[selectedIndex].x}
                y1={paddingTop}
                x2={points[selectedIndex].x}
                y2={chartHeight - paddingBottom}
                stroke="#9b5de5"
                strokeWidth="2"
                strokeOpacity="0.5"
              />
            )}

            {/* ANIMATED BEZIER LINE */}
            {curvePath && (
              <>
                <AnimatedPath
                  d={curvePath}
                  stroke="#ff4fa3"
                  strokeWidth="5"
                  strokeOpacity="0.25"
                  fill="none"
                />

                <AnimatedPath
                  d={curvePath}
                  stroke="#c77dff"
                  strokeWidth="4"
                  strokeOpacity="0.5"
                  fill="none"
                />

                <AnimatedPath
                  d={curvePath}
                  stroke="#9b5de5"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={pathLength}
                  strokeDashoffset={strokeDash}
                  strokeLinecap="round"
                />
              </>
            )}

            {/* POINTS */}
            {points.map((p, i) => (
              <AnimatedCircle
                key={i}
                cx={p.x}
                cy={p.y}
                r={selectedIndex === i ? 11 : p.hasData ? 7 : 4}
                transform={
                  selectedIndex === i
                    ? [{ scale: pulseAnim }]
                    : [{ scale: 1 }]
                }
                fill={
                  !p.hasData
                    ? "#ddd"
                    : selectedIndex === i
                      ? "#ff4fa3"
                      : moodColors[p.value]
                }
                stroke={selectedIndex === i ? "#fff" : "#ffffffaa"}
                strokeWidth="2"
              />
            ))}
          </Svg>
        </ScrollView>
      </View>

      {/* TOOLTIP */}
      {selectedIndex !== null && points[selectedIndex] && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipTime}>{points[selectedIndex].label}</Text>

          <View style={styles.tooltipRow}>
            <View
              style={[
                styles.tooltipDot,
                { backgroundColor: moodColors[points[selectedIndex].value] },
              ]}
            />

            <Text style={styles.tooltipMood}>
              {moodLabels[points[selectedIndex].value]}
            </Text>
          </View>

          {!points[selectedIndex].hasData && (
            <Text style={styles.tooltipEmpty}>No mood logged</Text>
          )}
          <Text style={styles.tooltipText}>
            {points[selectedIndex].label} •{" "}
            {moodLabels[points[selectedIndex].value]}
            {!points[selectedIndex].hasData ? " (no log)" : ""}
          </Text>
        </View>
      )}
    </View>
  );
};

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
    backgroundColor: "#f0f8ff",
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
    marginRight: 12,
    marginTop: 15,
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
    alignItems: "center",
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
    marginBottom: -30,
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

  emptyText: {
    color: "#888",
    marginTop: 10,
  },

  emptyChart: {},

  emptyChartText: {},

  tooltipTime: {},

  tooltipRow: {},

  tooltipDot: {},

  tooltipDot: {},

  tooltipEmpty: {},

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
    elevation: 5
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
