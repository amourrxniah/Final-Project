import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ActivitySimilar({
  similar,
  navigation,
  allActivities,
  mood,
  weather,
}) {
  return (
    <View style={styles.infoCard}>
    <View style={styles.infoHeader}>
      <MaterialCommunityIcons name="star-circle" size={32} color="#03a9f4" />
      <Text style={styles.infoTitle}>You might also like</Text>
    </View>

    {similar.map((s) => {
      const newRank = allActivities.findIndex((a) => a.id === s.id) + 1;

      return (
        <TouchableOpacity
          key={s.id}
          style={styles.similarRow}
          onPress={() =>
            navigation.push("ActivityDetails", {
              activity: s,
              allActivities,
              mood,
              weather,
              rank: newRank,
            })
          }
        >
          <View>
            <Text style={styles.similarText}>⭐ {s.title}</Text>
            <Text style={styles.similarSub}>
              📍 {formatDistance(s.distance)}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={24} color="#1976d2" />
        </TouchableOpacity>
      );
    })}
  </View>
  );
}

const formatDistance = (d) => {
  if (d == null) return "Distance unknown";
  if (d < 1000) return `${Math.round(d)} m away`;
  return `${(d / 1000).toFixed(1)} km away`;
};

const styles = StyleSheet.create({
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginTop: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  similarRow: {
    backgroundColor: "#e3f2fd",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  similarText: {
    color: "#0d47a1",
    fontWeight: "600",
  },

  similarSub: {
    color: "#555",
    fontSize: 13,
    marginTop: 2,
  },
});
