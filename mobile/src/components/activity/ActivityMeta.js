import { View, Text, StyleSheet } from "react-native";

export default function ActivityMeta({ meta, tags }) {
  return (
    <>
      {/* META */}
      <View style={styles.metaGrid}>
        {meta.map((m) => (
          <Text key={m} style={styles.meta}>
            {m}
          </Text>
        ))}
      </View>

      {/* TAGS */}
      <View style={styles.tags}>
        {tags.map((t) => (
          <View key={t} style={styles.tagPill}>
            <Text style={styles.tagText}>{t}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
