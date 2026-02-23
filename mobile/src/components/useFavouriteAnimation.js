import { useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function useFavouriteAnimation() {
  //flying heart position + opacity
  const flyingPos = useRef(new Animated.ValueXY()).current;
  const flyingOpacity = useRef(new Animated.Value(0)).current;

  //bookmark pulse
  const boomarkPulse = useRef(new Animated.Value(1)).current;

  const [showSparkle, setShowSparkle] = useState(false);

  //animate heart from card -> bookmark
  const animateToTarget = (start, end) => {
    flyingPos.setValue(start);
    flyingOpacity.setValue(1);

    Animated.sequence([
      //lift up + curve
      Animated.parallel([
        Animated.timing(flyingPos.x, {
          toValue: (start.x + end.x) / 2,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(flyingPos.y, {
          toValue: start.y - 120,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      //fly into bookmark + fade
      Animated.parallel([
        Animated.timing(flyingPos.x, {
          toValue: end.x,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flyingPos.y, {
          toValue: end.y,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(flyingOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      pulseBookmark();
      sparkle();
    });
  };

  //pulse bookmark icon
  const pulseBookmark = () => {
    Animated.sequence([
      Animated.timing(boomarkPulse, {
        toValue: 1.3,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(boomarkPulse, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const sparkle = () => {
    setShowSparkle(true);
    setTimeout(() => setShowSparkle(false), 400);
  };

  const FlyingHeart = () => (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        zIndex: 9999,
        opacity: flyingOpacity,
        transform: [
          { translateX: flyingPos.x },
          { translateY: flyingPos.y },
          {
            scale: flyingOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
          },
        ],
      }}
    >
      <MaterialCommunityIcons name="heart" size={30} color="#ff4fa3" />
    </Animated.View>
  );

  const Sparkle = ({ x, y }) =>
    showSparkle ? (
      <View style={{ position: "absolute", left: x - 16, top: y - 16 }}>
        <MaterialCommunityIcons name="sparkles" size={32} color="#ffd700" />
      </View>
    ) : null;

  return {
    animateToTarget,
    FlyingHeart,
    boomarkPulse,
    Sparkle,
  };
}
