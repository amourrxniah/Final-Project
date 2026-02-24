import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFavouriteAnimation } from "../components/useFavouriteAnimation";

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

export default function ActivityDetailsScreen({ route, navigation}) {
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

    /* ---------- FAVOURITE ---------- */
    const [isFav, setIsFav] = useState(false);

    const heartRef = useRef(null);
    const favouritesTargetRef = useRef(null);
    const { animateToTarget, FlyingHeart, bookmarkPulse } = 
    useFavouriteAnimation();

    const toggleFavourite = () => {
        setIsFav(prev => !prev);

        if (!heartRef.current || !favouritesTargetRef.current) return;

        heartRef.current.measureInWindow((sx, sy, sw, sh) => {
            favouritesTargetRef.current.measureInWindow((ex, ey, ew, eh) => {
                animateToTarget(
                    { x: sx + sw / 2 - 15, y: sy + sh / 2 - 15 },
                    { x: ex + ew / 2 - 15, y: ey + eh / 2 - 15 }
                );
            });
        });
    };

    /* ---------- RATING ---------- */
    const [rating, setRating] = useState(0);
    const [helpfulState, setHelpfulState] = useState(null);

    useEffect(() => {
        loadRating();
    }, []);

    const loadRating = async () => {
        const saved = await AsyncStorage.getItem(`rating_${activity.id}`);
        if (saved) animateStars(Number(saved));
    };

    const setStars = async (value) => {
        setRating(value);
        await AsyncStorage.setItem(`rating_${activity.id}`, String(value));
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
    
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
                        <MaterialCommunityIcons name="arrow-left" size={30} />
                    </TouchableOpacity>
    
                    <View style={styles.headerTitleWrap}>
                        <MaskedView maskElement={<Text style={styles.headerTitle}>Details</Text>}>
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

                        <TouchableOpacity>
                            <Ionicons name="share-outline" size={24} color="#555" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >

                    {/* HERO CARD + DETAILS */}
                    <View style={styles.combinedCard}>
                        <LinearGradient colors={hero.gradient} style={styles.heroTop}>
                            <MaterialCommunityIcons name={hero.icon} size={70} color="#fff" />
                            <View style={styles.categoryBubble}>
                                <Text style={styles.categoryText}>{hero.label}</Text>
                            </View>
                        </LinearGradient>

                        <View style={styles.detailsBox}>
                            <Text style={styles.title}>{activity.title}</Text>
                            <Text style={styles.subtitle}>{activity.subtitle} </Text>

                            {/* META */}
                            <View style={styles.metaGrid}>
                                {meta.map((m) => (
                                    <Text key={m} style={styles.meta}>{m}</Text>
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
                        </View>
                    </View>
                    
                    {/* WHY */}
                    <InfoCard 
                        icon="trophy" 
                        color="#ff9800"
                        title={`Why we ranked this #${safeRank}`}
                    >
                        <Text style={styles.bodyText}>{why}</Text>
                    </InfoCard>

                    {/* BENEFITS */}
                    <InfoCard icon="heart-circle" color="#e91e63" title="Benefits">
                        {benefits.map((b) => (
                            <Text key={b} style={styles.bullet}>✔ {b}</Text>
                        ))}
                    </InfoCard>

                    {/* TIPS */}
                    <InfoCard icon="lightbulb" color="#4caf50" title="Tips to get started">
                        {tips.map((t) => (
                            <Text key={t} style={styles.bullet}>• {t}</Text>
                        ))}
                    </InfoCard>

                    {/* SIMILAR */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <MaterialCommunityIcons name="star-circle" size={32} color="#03a9f4" />
                            <Text style={styles.infoTitle}>You might also like</Text>
                        </View>

                        {similar.map((s) => {
                            const newRank = allActivities.findIndex(a => a.id === s.id) + 1;

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
                                            rank: newRank
                                        })
                                    }                            
                                >
                                    <Text style={styles.similarText}>⭐ {s.title}</Text>
                                    <Text style={styles.similarSub}>
                                        📍 {formatDistance(s.distance)}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={24} color="#1976d2" />
                                </TouchableOpacity>
                            )
                        })}
                    </View>

                    {/* RATE */}
                    <View style={styles.infoCard}>
                        <View style={styles.centerHeader}>
                            <MaterialCommunityIcons name="star-four-points" size={30} color="#ffc107" />
                            <Text style={styles.infoTitle}>Rate this recommendation</Text>
                            <Text style={styles.rateSub}>Your feedback helps us improve future recommendations</Text>
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
                                style={[styles.helpfulBtn, helpfulState === "up" && styles.activeHelpful]}
                                onPress={() => setHelpfulState("up")}
                            >
                                <MaterialCommunityIcons
                                    name={helpfulState === "up" ? "thumb-up" : "thumb-up-outline"}
                                    size={20}
                                />
                                <Text>Helpful</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.helpfulBtn, helpfulState === "down" && styles.activeHelpful]}
                                onPress={() => setHelpfulState("down")}
                            >
                                <MaterialCommunityIcons
                                    name={helpfulState === "down" ? "thumb-down" : "thumb-down-outline"}
                                    size={20}
                                />
                                <Text>Not Helpful</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
            
            <AIAssistant />

            <FlyingHeart />

            <BottomNav 
                navigation={navigation} 
                active="mood" 
                favouriteRef={favouritesTargetRef}
                bookmarkPulse={bookmarkPulse}
            />
        </View>
    );
}

/* -------------------- SMALL UI COMPONENTS -------------------- */
const InfoCard = ({ icon, color, title, children }) => (
    <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
            <MaterialCommunityIcons name={icon} size={32} color={color} />
            <Text style={styles.infoTitle}>{title}</Text>
        </View>
        {children}
    </View>
);

const formatDistance = (d) => {
    if (d == null) return "Distance unknown";
    if (d < 1000) return `${Math.round(d)} m away`;
    return `${(d / 1000).toFixed(1)} km away`;
};

/* -------------------- HERO THEME -------------------- */
const getHeroTheme = (categories = []) => {
    const joined = categories.join(" ").toLowerCase();

    if (joined.includes("museum") || joined.includes("gallery"))
        return { label: "Cultural", icon: "bank", gradient: ["#8e24aa", "#ce93d8"] };
    if (joined.includes("park")) 
        return { label: "Relaxing", icon: "tree", gradient: ["#66bb6a", "#c8e6c9"] };
    return { label: "Nearby", icon: "map-marker", gradient: ["#b36bff", "#ff4fa3"] };
    
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
        alignItems: "center"
    },

    headerTitle: {
        fontSize: 30,
        fontWeight: "700",
    },

    headerActions: {
        flexDirection: "row",
        gap: 14,
        width: 60
    },

    combinedCard: {
        borderRadius: 28,
        overflow: "hidden",
        marginBottom: 10
    },

    heroTop: {
        height: 170,
        alignItems: "center",
        gap: 12,
        justifyContent: "center"
    },

    categoryBubble: {
        backgroundColor: "#fff",
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 22,
    },

    categoryText: {
        color: "#333", 
        fontWeight: "700"
    },

    detailsBox: {
        backgroundColor: "#fff",
        padding: 16
    },

    title: {
        fontSize: 26,
        fontWeight: "700"
    },

    subtitle: {
        color: "#666",
        marginTop: 8,
        marginBottom: 14
    },

    metaGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10
    },

    meta: {
        color: "#555"
    },

    tags: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 12
    },

    tagPill: {
        backgroundColor: "#e3f2fd",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20
    },

    tagText: {
        color: "#6b5cff",
        fontWeight: "600"
    },

    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 22,
        padding: 16,
        marginTop: 18,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4
    },

    infoHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10
    },

    centerHeader: {
        alignItems: "center",
        gap: 6,
        marginBottom: 10
    },

    infoTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333"
    },

    rateSub: {
        color: "#777",
        textAlign: "center"
    },

    bodyText: {
        color: "#444",
        lineHeight: 22
    },

    bullet: {
        marginVertical: 4,
        color: "#444"
    },

    similarRow: {
        backgroundColor: "#e3f2fd",
        borderRadius: 18,
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10
    },

    similarText: {
        color: "#0d47a1",
        fontWeight: "600",
    },

    similarSub: {
        color: "#555",
        fontSize: 13,
        marginTop: 2
    },

    starRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 20,
        marginVertical: 10
    },

    helpfulRow: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 8
    },

    helpfulBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#f1f1f1"
    },

    activeHelpful: {
        backgroundColor: "#dcd2ff"
    },

    flyingHeart: {
        position: "absolute",
        left: 0,
        top: 0,
        zIndex: 999
    },
})