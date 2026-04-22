import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function QuickActions({ activity }) {
  return (
    <View style={styles.row}>
      <Action icon="play" label="Start" />
      <Action icon="bookmark" label="Save" />
      <Action icon="navigate" label="Go" />
      <Action icon="share-social" label="Share" />
    </View>
  );
}

const Action = ({ icon, label }) => {
  return (
    <TouchableOpacity style={styles.btn}>
      <Ionicons name={icon} size={20} />
      <Text>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  btn: {
    alignItems: "center",
    gap: 5,
  },
});
