import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function SkeletonCard() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* RANK */}
        <View style={styles.rankCircle} />

        <MaskedView
          maskElement={
            <View>
              <View style={styles.row}>
                <View style={styles.iconCircle} />
                <View style={{ flex: 1 }}>
                  <View style={styles.lineWide} />
                  <View style={styles.line} />
                  <View style={styles.metaRow}>
                    <View style={styles.lineSmall} />
                    <View style={styles.tagPill} />
                  </View>
                </View>
              </View>

              <View style={styles.feedback}>
                <View style={styles.feedbackBtn} />
                <View style={styles.feedbackBtn} />
              </View>
            </View>
          }
        >
          <Animated.View
            style={{
              transform: [{ translateX }],
            }}
          >
            <LinearGradient
              colors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmer}
            />
          </Animated.View>
        </MaskedView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingLeft: 12,
    paddingTop: 22,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 18,
    elevation: 4,
    overflow: "hidden",
  },

  shimmer: {
    width: SCREEN_WIDTH * 2,
    height: 220,
  },

  rankCircle: {
    position: "absolute",
    top: -18,
    left: -18,
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: "#e0e0e0",
  },

  row: {
    flexDirection: "row",
    gap: 12,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ddd",
  },

  lineWide: {
    height: 16,
    width: "80%",
    borderRadius: 8,
    backgroundColor: "#ddd",
    marginBottom: 10,
  },

  line: {
    height: 14,
    width: "60%",
    borderRadius: 7,
    backgroundColor: "#ddd",
    marginBottom: 10,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  lineSmall: {
    height: 12,
    width: "40%",
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },

  tagPill: {
    width: 80,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ddd",
  },

  feedback: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 14,
  },

  feedbackBtn: {
    width: 120,
    height: 34,
    borderRadius: 18,
    backgroundColor: "#ddd",
  },
});
