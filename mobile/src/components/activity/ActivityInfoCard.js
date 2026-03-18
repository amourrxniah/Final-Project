import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ActivityInfoCard({ icon, color, title, children }) {
    return (
        <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name={icon} size={32} color={color} />
              <Text style={styles.infoTitle}>{title}</Text>
            </View>
            {children}
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
})
