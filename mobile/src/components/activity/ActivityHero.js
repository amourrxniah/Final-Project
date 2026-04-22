import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ActivityMeta from "./ActivityMeta";

export default function ActivityHero({
  activity,
  hero,
  meta,
  tags,
  confidence,
}) {
  return (
    <View style={styles.combinedCard}>
      <LinearGradient colors={hero.gradient} style={styles.heroTop}>
        <Text style={styles.confidence}>🔥 {confidence}% match</Text>
        <MaterialCommunityIcons name={hero.icon} size={70} color="#fff" />

        <View style={styles.categoryBubble}>
          <Text style={styles.categoryText}>{hero.label}</Text>
        </View>
      </LinearGradient>

      <View style={styles.detailsBox}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.subtitle}>{activity.subtitle} </Text>

        {/* META */}
        <ActivityMeta meta={meta} tags={tags} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  combinedCard: {
    borderRadius: 28,
    overflow: "hidden",
    marginBottom: 10,
  },

  heroTop: {
    height: 170,
    alignItems: "center",
    gap: 12,
    justifyContent: "center",
  },

  categoryBubble: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
  },

  categoryText: {
    color: "#333",
    fontWeight: "700",
  },

  detailsBox: {
    backgroundColor: "#fff",
    padding: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
  },

  subtitle: {
    color: "#666",
    marginTop: 8,
    marginBottom: 14,
  },

  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  meta: {
    color: "#555",
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  tagPill: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  tagText: {
    color: "#6b5cff",
    fontWeight: "600",
  },
});
