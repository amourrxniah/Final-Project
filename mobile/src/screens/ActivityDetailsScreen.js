import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share
} from "react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { 
  addFavourite, 
  removeFavourite, 
  getFavouriteState,
  sendActivityFeedback,
  getActivityFeedback,
  logActivityOpen
} from "../components/api";

import { useFavouriteAnimation } from "../components/useFavouriteAnimation";

import ActivityHeader from "../components/activity/ActivityHeader";
import ActivityHero from "../components/activity/ActivityHero";
import ActivityInfoCard from "../components/activity/ActivityInfoCard";
import ActivityRating from "../components/activity/ActivityRating";
import ActivitySimilar from "../components/activity/ActivitySimilar";

import AIAssistant from "../components/AIAssistant/AIAssistant";
import BottomNav from "../components/BottomNav";

import {
  deriveMeta,
  deriveTags,
  deriveWhy,
  deriveBenefits,
  deriveTips,
  findSimilarActivities,
} from "../components/ActivityDerivation";

/* -------------------- HERO THEME -------------------- */
const getHeroTheme = (categories = []) => {
  const joined = categories.join(" ").toLowerCase();

  if (joined.includes("museum") || joined.includes("gallery"))
    return {
      label: "Cultural",
      icon: "bank",
      gradient: ["#8e24aa", "#ce93d8"],
    };
  if (joined.includes("park"))
    return {
      label: "Relaxing",
      icon: "tree",
      gradient: ["#66bb6a", "#c8e6c9"],
    };
  return {
    label: "Nearby",
    icon: "map-marker",
    gradient: ["#b36bff", "#ff4fa3"],
  };
};

export default function ActivityDetailsScreen({ route, navigation }) {
  const { activity, allActivities = [], mood, weather, rank } = route.params;
  const safeRank = rank ?? 1;

  /* ---------- DERIVED CONTENT ---------- */
  const meta = deriveMeta(activity);
  const tags = deriveTags(activity.category_names);
  const why = deriveWhy({ mood, weather, activity });
  const benefits = deriveBenefits(activity.category_names);
  const tips = deriveTips(activity.category_names);
  const similar = findSimilarActivities(activity, allActivities);

  /* ---------- HERO ---------- */
  const hero = getHeroTheme(activity.category_names);

  /* ---------- STATE ---------- */
  const [isFav, setIsFav] = useState(false);
  const [undoItem, setUndoItem] = useState(null);
  const [rating, setRating] = useState(0);
  const [helpfulState, setHelpfulState] = useState(null);

  /* ---------- ANIMATION ---------- */
  const heartRef = useRef(null);
  const favouritesTargetRef = useRef(null);

  const { animateToTarget, FlyingHeart, bookmarkPulse } =
    useFavouriteAnimation();

  /* ---------- LOAD USER STATE ---------- */
  const loadUserState = async () => {
    try {
      const fav = await getFavouriteState(activity.id);
      setIsFav(fav?.is_favourite || false);

      const feedback = await getActivityFeedback(activity.id);

      setRating(feedback?.rating || 0);
      setHelpfulState(feedback?.feedback || null);

      await logActivityOpen(activity.id);
    } catch (err) {
      console.log("Load user state error", err?.response?.data || err.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUserState();
    }, [activity.id]),
  );

  /* ---------- FAVOURITE ---------- */
  const toggleFavourite = async () => {
    const previous = isFav;
    const newState = !previous;

    setIsFav(newState);

    //trigger undo only when adding
    if (newState) {
      setUndoItem({
        id: activity.id,
        title: activity.title,
      });
    }

    //animation
    if (!heartRef.current || !favouritesTargetRef.current) return;

    heartRef.current.measureInWindow((sx, sy, sw, sh) => {
      favouritesTargetRef.current.measureInWindow((ex, ey, ew, eh) => {
        animateToTarget(
          { x: sx + sw / 2 - 15, y: sy + sh / 2 - 15 },
          { x: ex + ew / 2 - 15, y: ey + eh / 2 - 15 },
        );
      });
    });

    try {
      if (newState) {
        await addFavourite(activity.id);
      } else {
        await removeFavourite(activity.id);
      }

      //auto hide undo after 5 seconds
      setTimeout(() => setUndoItem(null), 5000);
    } catch (err) {
      console.log("Favourite error", err);
      setIsFav(previous);
    }
  };

  /* ---------- RATING ---------- */
  const setStars = async (value) => {
    const previous = rating;

    setRating(value);

    try {
      await sendActivityFeedback({
        activityId: activity.id,
        rating: value
      });
    } catch (err) {
      console.log("Rating save failed", err?.data || err.message);
      setRating(previous);
    }
  };

  const handleHelpful = async (type) => {
    const previous = helpfulState;
    const newValue = previous === type ? null : type;

    setHelpfulState(newValue);

    try {
      await sendActivityFeedback({
        activityId: activity.id,
        feedback: newValue
      });
    } catch (err) {
      console.log("Helpful save error", err);
      setHelpfulState(previous);
    }
  };

  /* ---------- SHARE ---------- */
  const handleShare = async () => {
    try {
      await Share.share({
        title: activity.title,
        message: `🌟 Check out this activity: ${activity.title}\n\n${activity.subtitle}\n\nRecommended by MoodSync`,
      });
    } catch (err) {
      console.log("Share error", err.message);
    }
  };

  useEffect(() => {
    loadRating();
    checkFavourite();
  }, []);

  const loadRating = async () => {
    const saved = await AsyncStorage.getItem(`rating_${activity.id}`);
    if (saved) setRating(Number(saved));
  };

  const checkFavourite = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.get(`${BACKEND_URL}/favourites/${activity.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setIsFav(res.data?.is_favourite || false);
    } catch (err) {
      console.log("Check favourite error", err);
    }
  }; 

  /* ---------- LOAD SAVED FEEDBACK ---------- */
  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await axios.get(`${BACKEND_URL}/feedback/${activity.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.rating) {
        setRating(res.data.rating);
      }

      if (res.data.type) {
        setHelpfulState(res.data.type);
      }
    } catch (err) {
      console.log("Load feedback error", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>

        {/* HEADER */}
        <ActivityHeader 
          navigation={navigation}
          isFav={isFav}
          toggleFavourite={toggleFavourite}
          handleShare={handleShare}
          heartRef={heartRef}
        />
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >

          {/* HERO CARD + DETAILS */}
          <ActivityHero 
            activity={activity}
            hero={hero}
            meta={meta}
            tags={tags}
          />

          <ActivityInfoCard
            icon="trophy"
            color="#ff9800"
            title={`Why we ranked this #${safeRank}`}
          >
            <Text style={styles.bodyText}>{why}</Text>
          </ActivityInfoCard>

          <ActivityInfoCard 
            icon="heart-circle" 
            color="#e91e63" 
            title="Benefits"
          >
            {benefits.map((b) => (
                <Text key={b} style={styles.bullet}>
                  ✔ {b}
                </Text>
              ))}
          </ActivityInfoCard>

          {/* TIPS */}
          <ActivityInfoCard
            icon="lightbulb"
            color="#4caf50"
            title="Tips to get started"
          >
            {tips.map((t) => (
              <Text key={t} style={styles.bullet}>
                • {t}
              </Text>
            ))}
          </ActivityInfoCard>

          <ActivitySimilar 
            similar={similar}
            navigation={navigation}
            allActivities={allActivities}
            mood={mood}
            weather={weather}
          />

          <ActivityRating 
            rating={rating}
            setStars={setStars}
            helpfulState={helpfulState}
            handleHelpful={handleHelpful}
          />

        </ScrollView>
      </View>

      <AIAssistant />

      <FlyingHeart />

      {undoItem && (
        <View style={styles.undoContainer}>
          <View style={styles.undoTextWrap}>
            <Text
              style={styles.undoText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Added "{undoItem.title}" to favourites
            </Text>
          </View>

          <TouchableOpacity
            onPress={async () => {
              setIsFav(false);
              setUndoItem(null);
              await removeFavourite(undoItem.id);
              
            }}
          >
            <Text style={styles.undoBtn}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      <BottomNav
        navigation={navigation}
        active="mood"
        favouriteRef={favouritesTargetRef}
        bookmarkPulse={bookmarkPulse}
      />
    </View>
  );
}


const formatDistance = (d) => {
  if (d == null) return "Distance unknown";
  if (d < 1000) return `${Math.round(d)} m away`;
  return `${(d / 1000).toFixed(1)} km away`;
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },

  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
  },

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

  bodyText: {
    color: "#444",
    lineHeight: 22,
  },

  bullet: {
    marginVertical: 4,
    color: "#444",
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

  flyingHeart: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 999,
  },

  undoContainer: {
    position: "absolute",
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: "#333",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 9999,
  },

  undoTextWrap: {
    flex: 1,
    marginRight: 12,
  },

  undoText: {
    color: "#fff",
    fontWeight: "600",
  },

  undoBtn: {
    color: "#ff4fa3",
    fontWeight: "800",
  },
});
