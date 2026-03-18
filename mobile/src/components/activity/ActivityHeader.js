import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

export default function ActivityHeader({
  navigation,
  isFav,
  toggleFavourite,
  handleShare,
  heartRef,
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <MaterialCommunityIcons name="arrow-left" size={30} />
      </TouchableOpacity>

      <View style={styles.headerTitleWrap}>
        <MaskedView
          maskElement={<Text style={styles.headerTitle}>Details</Text>}
        >
          <LinearGradient
            colors={["#b36bff", "#ff4fa3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.headerTitle, { opacity: 0 }]}>Details</Text>
          </LinearGradient>
        </MaskedView>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity ref={heartRef} onPress={toggleFavourite}>
          <MaterialCommunityIcons
            name={isFav ? "heart" : "heart-outline"}
            size={28}
            color={isFav ? "#ff4fa3" : "#555"}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color="#555" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
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

  headerActions: {
    flexDirection: "row",
    gap: 14,
    width: 60,
  },
});
