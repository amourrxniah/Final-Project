import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ActivityRating({
  rating,
  setStars,
  helpfulState,
  handleHelpful,
}) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.centerHeader}>
        <MaterialCommunityIcons
          name="star-four-points"
          size={30}
          color="#ffc107"
        />
        <Text style={styles.infoTitle}>Rate this recommendation</Text>
        <Text style={styles.rateSub}>
          Your feedback helps us improve future recommendations
        </Text>
      </View>

      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} onPress={() => setStars(i)}>
            <MaterialCommunityIcons
              name="star-circle"
              size={40}
              color={i <= rating ? "#ffb300" : "#ccc"}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* HELPFUL */}
      <View style={styles.helpfulRow}>
        <TouchableOpacity
          style={[
            styles.helpfulBtn,
            helpfulState === "up" && styles.activeHelpful,
          ]}
          onPress={() => handleHelpful("up")}
        >
          <MaterialCommunityIcons
            name={helpfulState === "up" ? "thumb-up" : "thumb-up-outline"}
            size={20}
          />
          <Text>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.helpfulBtn,
            helpfulState === "down" && styles.activeHelpful,
          ]}
          onPress={() => handleHelpful("down")}
        >
          <MaterialCommunityIcons
            name={helpfulState === "down" ? "thumb-down" : "thumb-down-outline"}
            size={20}
          />
          <Text>Dislike</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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

  centerHeader: {
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },

  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },

  rateSub: {
    color: "#777",
    textAlign: "center",
  },

  starRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginVertical: 10,
  },

  helpfulRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },

  helpfulBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
  },

  activeHelpful: {
    backgroundColor: "#dcd2ff",
  },
});
