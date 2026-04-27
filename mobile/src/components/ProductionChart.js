import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function ProductionChart({ data, viewMode }) {
  /* ---------- STATE ---------- */
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [isPinching, setIsPinching] = useState(false);

  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);
  const hasAutoScrolled = useRef(false);
  const lastDistance = useRef(null);
  const scaleRef = useRef(1.2);

  /* ---------- SAFE DATA ---------- */
  const safeData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((d) => ({
      value:
        d.has_data && d.value !== null && d.value !== undefined
          ? Math.max(0, Math.min(2, Number(d.value)))
          : 1, // always fallback to neutral
      label: d.time || d.day || "",
      hasData: !!d.has_data,
      timestamp: d.timestamp || 0,
    }));
  }, [data]);

  const sortedData = useMemo(() => {
    return [...safeData].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    );
  }, [safeData]);

  /* ---------- ANIMATION ---------- */
  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    setSelectedIndex(null);
  }, [sortedData]);

  /* ---------- POINT PULSE ANIMATION ---------- */
  useEffect(() => {
    if (selectedIndex === null) return;

    pulse.setValue(1);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.005,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [selectedIndex]);

  /* ---------- DIMENSIONS ---------- */
  const chartHeight = 300;
  const yAxisWidth = 55;

  const paddingTop = 20;
  const paddingBottom = 50;
  const paddingLeft = 20;
  const paddingRight = 60;

  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const stepY = graphHeight / 2; // 3 mood levels: 0, 1, 2

  const getY = (value) => {
    const normalised = value / 2;
    return paddingTop + graphHeight * (1 - normalised);
  };

  const baseSpacing =
    viewMode === "live"
      ? 70
      : viewMode === "yesterday"
        ? 70
        : viewMode === "week"
          ? 110
          : 100; //daily default

  const pointSpacing = baseSpacing * scale;

  /* ---------- DATA TO POINTS ---------- */
  const points = sortedData.map((d, i) => ({
    x: paddingLeft + i * pointSpacing,
    y: getY(d.value),
    ...d,
  }));

  const chartWidth =
    paddingLeft + paddingRight + Math.max(points.length, 24) * pointSpacing;

  const hasLogs = points.some((p) => p.hasData);

  /* ---------- AUTO SCROLL ---------- */
  useEffect(() => {
    if (!scrollRef.current || !points.length || hasAutoScrolled.current) return;

    setTimeout(() => {
      let x = 0;

      if (viewMode === "live") {
        const last = points[points.length - 1];
        scrollRef.current?.scrollTo({
          x: Math.max(0, last.x - 200),
          animated: true,
        });
      }
      scrollRef.current?.scrollTo({ x, animated: true });
      hasAutoScrolled.current = true;
    }, 300);
  }, [points]);

  /* ---------- EMPTY STATE ---------- */
  if (!points.length) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="chart-line" size={40} color="#ddd" />
        <Text>No mood data yet.</Text>
      </View>
    );
  }

  /* ---------- CURVES ---------- */
  const smoothPath = (p1, p2) => {
    const dx = (p2.x - p1.x) * 0.5;

    // exact top/bottom snapping
    const clampY = (y) => {
      if (y <= paddingTop + 2) return paddingTop; // high = top
      if (y >= chartHeight - paddingBottom - 2)
        return chartHeight - paddingBottom; // low = bottom
      return y;
    };

    const y1 = clampY(p1.y);
    const y2 = clampY(p2.y);

    return `
      M ${p1.x} ${y1}
      C ${p1.x + dx} ${y1},
        ${p2.x - dx} ${y2},
        ${p2.x} ${y2},
    `;
  };

  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    let color = "#9b5de5";
    if (p2.value > p1.value) color = "#2ec4b6";
    else if (p2.value < p1.value) color = "#ff4fa3";

    segments.push({
      d: smoothPath(p1, p2),
      color,
    });
  }

  /* ---------- ZOOM BUTTONS ---------- */
  const zoomIn = () => {
    setScale((s) => Math.min(3, s + 0.2));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const zoomOut = () => {
    setScale((s) => Math.max(0.8, s - 0.2));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /* ---------- TAP SELECT ---------- */
  const handlePress = (e) => {
    const { locationX } = e.nativeEvent;

    let closest = 0;
    let min = Infinity;

    points.forEach((p, i) => {
      const dist = Math.abs(p.x - locationX);
      if (dist < min) {
        min = dist;
        closest = i;
      }
    });

    setSelectedIndex(closest);
    Haptics.selectionAsync();
  };

  const moodLabels = ["Low", "Neutral", "High"];
  const moodColors = ["#ff4fa3", "#9b5de5", "#2ec4b6"];

  /* ---------- RENDER ---------- */
  return (
    <View>
      {/* ZOOM CONTROLS */}
      <View style={styles.zoomControls}>
        <TouchableOpacity onPress={zoomOut} style={styles.controlBtn}>
          <Text style={styles.controlText}>−</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity onPress={zoomIn} style={styles.controlBtn}>
          <Text style={styles.controlText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        <View style={{ flexDirection: "row" }}>
          {/* FIXED Y AXIS */}
          <Svg width={yAxisWidth} height={chartHeight}>
            {[0, 1, 2].map((v) => (
              <SvgText
                key={v}
                x={yAxisWidth - 10}
                y={paddingTop + graphHeight - v * stepY + 4}
                fontSize="12"
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
              strokeWidth="3"
            />
          </Svg>

          {/* CHART */}
          <ScrollView
            ref={scrollRef}
            horizontal
            scrollEnabled={!isPinching}
            nestedScrollEnabled
            decelerationRate="fast"
            bounces={false}
            showsHorizontalScrollIndicator={false}
          >
            <Svg
              width={chartWidth}
              height={chartHeight}
              onStartShouldSetResponder={() => true}
              onResponderRelease={handlePress}
            >
              {/* HORIZONTAL GRID LINES */}
              {Array.from({ length: 5 }).map((_, i) => {
                const y = paddingTop + (graphHeight / 4) * i;
                return (
                  <Line
                    key={`h-${i}`}
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#eaeaf0"
                  />
                );
              })}

              {/* VERTICAL GRID LINES */}
              {points.map((p, i) => (
                <Line
                  key={`v-${i}`}
                  x1={p.x}
                  y1={paddingTop}
                  x2={p.x}
                  y2={chartHeight - paddingBottom}
                  stroke="#f0f0f5"
                />
              ))}

              {/* NO LOGS LINE */}
              {!hasLogs && viewMode === "yesterday" && (
                <Line
                  x1={0}
                  y1={paddingTop + graphHeight - stepY}
                  x2={chartWidth}
                  y2={paddingTop + graphHeight - stepY}
                  stroke="#bbb"
                  strokeDasharray="5 5"
                />
              )}

              {/* CURVES */}
              {segments.map((seg, i) => (
                <AnimatedPath
                  key={i}
                  d={seg.d}
                  stroke={seg.color}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1000"
                  strokeDashoffset={progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1000, 0],
                  })}
                />
              ))}

              {/* POINTS */}
              {points.map((p, i) => {
                const selected = selectedIndex === i;

                return (
                  <React.Fragment key={i}>
                    {/* GLOW */}
                    {selected && (
                      <AnimatedCircle
                        cx={p.x}
                        cy={p.y}
                        opacity={0.2}
                        fill={moodColors[p.value]}
                        transform={[{ scale: pulse }]}
                      />
                    )}

                    {/* MAIN DOT */}
                    <AnimatedCircle
                      cx={p.x}
                      cy={p.y}
                      r={selected ? 6 : 4}
                      fill={moodColors[p.value]}
                    />
                  </React.Fragment>
                );
              })}

              {/* ACTIVE LINE */}
              {selectedIndex !== null && points[selectedIndex] && (
                <Line
                  x1={points[selectedIndex].x}
                  y1={paddingTop}
                  x2={points[selectedIndex].x}
                  y2={chartHeight - paddingBottom}
                  stroke="#9b5de5"
                  strokeWidth="2"
                  strokeOpacity="0.4"
                />
              )}

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
                let show = true;

                if (viewMode === "week") show = i % 2 === 0;
                if (viewMode === "month") show = i % 5 === 0;

                if (!show) return null;

                return (
                  <SvgText
                    key={`x-${i}`}
                    x={p.x}
                    y={chartHeight - 15}
                    fontSize="12"
                    fill="#888"
                    textAnchor="middle"
                  >
                    {p.label}
                  </SvgText>
                );
              })}
            </Svg>
          </ScrollView>
        </View>

        {/* TOOLTIP */}
        {selectedIndex !== null && points[selectedIndex] && (
          <View style={styles.tooltipWrapper}>
            <View style={styles.tooltipCard}>
              <View
                style={[
                  styles.tooltipDot,
                  { backgroundColor: moodColors[points[selectedIndex].value] },
                ]}
              />

              <View>
                <Text style={styles.tooltipLabel}>
                  {points[selectedIndex].label}
                </Text>
                <Text style={styles.tooltipValue}>
                  {moodLabels[points[selectedIndex].value]} Mood
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    position: "relative",
  },
  zoomControls: {
    position: "absolute",
    top: -11,
    right: -10,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  controlBtn: {
    paddingHorizontal: 11,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  controlText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
  },

  divider: {
    width: 1,
    height: 18,
    backgroundColor: "#ddd",
  },

  tooltipWrapper: {
    alignItems: "center",
    marginTop: 6,
  },

  tooltipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  tooltipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  tooltipLabel: {
    fontSize: 12,
    color: "#8e8e93",
  },

  tooltipValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111",
  },

  empty: {
    alignItems: "center",
    padding: 30,
  },
});
