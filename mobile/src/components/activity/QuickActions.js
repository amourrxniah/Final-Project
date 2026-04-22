import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function QuickActions({ activity }) {
  return (
    <View style={styles.row}>
      <Action icon="play" label="Start" />
    </View>
  );
}

const Action = ({ icon, label }) => {
  <TouchableOpacity>
    <Ionicons />
    <Text></Text>
  </TouchableOpacity>;
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
