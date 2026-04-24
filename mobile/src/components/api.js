import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import axios from "axios";

export const BACKEND_URL = "https://final-project-8-q2v4.onrender.com";

/* -------------------- AXIOS -------------------- */
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
});

/* attach token automatically */
api.interceptors.request.use(async (config) => {
  return getToken().then((token) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
});

/* -------------------- DEVICE ID -------------------- */
export const getDeviceId = async () => {
  let deviceId = await AsyncStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await AsyncStorage.setItem("device_id", deviceId);
  }

  return deviceId;
};

/* -------------------- USER ID -------------------- */
export const getUserId = async () => {
  let userId = await AsyncStorage.getItem("user_id");

  if (!userId) {
    const deviceId = await getDeviceId();

    const res = await api.post("/users/anonymous", {
      device_id: deviceId,
    });

    userId = String(res.data.id);

    await AsyncStorage.setItem("user_id", userId);
  }

  return userId;
};

/* -------------------- TOKEN -------------------- */
export const saveToken = async (token) => {
  await AsyncStorage.setItem("token", token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem("token");
};

/* -------------------- CONSENT -------------------- */
export const checkConsent = async () => {
  const cached = await AsyncStorage.getItem("userConsent");

  if (cached === "true") {
    return true;
  }

  try {
    const userId = await getUserId();

    const res = await api.get(`/consent/me`, {
      params: { user_id: userId },
    });

    if (res.data?.accepted) {
      await AsyncStorage.setItem("userConsent", "true");
      return true;
    }

    return false;
  } catch (err) {
    console.log("Consent check error:", err);
    return false;
  }
};

export const acceptConsent = async () => {
  const userId = await getUserId();
  const deviceId = await getDeviceId();

  await api.post("/consent/accept", {
    user_id: userId,
    device_id: deviceId,
  });

  await AsyncStorage.setItem("userConsent", "true");
};

/* -------------------- AUTH REQUEST -------------------- */
export const authRequest = async (url, data) => {
  return api.post(url, data);
};

/* -------------------- GET USER -------------------- */
export const getCurrentUser = async () => {
  const res = await api.get("/auth/me");

  await AsyncStorage.setItem("user", JSON.stringify(res.data));

  return res.data;
};

/* -------------------- GOOGLE LOGIN -------------------- */
export const loginGoogle = async (accessToken) => {
  const res = await api.post("/auth/google", {
    access_token: accessToken,
  });

  await saveToken(res.data.access_token);
  return res.data;
};

/* -------------------- APPLE LOGIN -------------------- */
export const loginApple = async (credential) => {
  const res = await api.post("/auth/apple", {
    email: credential.email,
    full_name: credential.fullName,
  });

  await saveToken(res.data.access_token);
  return res.data;
};

/* -------------------- RESET PASSWORD -------------------- */
export const requestPasswordReset = async (email) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

/* -------------------- MANUAL SIGNUP -------------------- */
export const loginManual = async (identifier, password) => {
  const res = await api.post("/auth/login", {
    identifier: identifier.toLowerCase(),
    password,
  });

  await saveToken(res.data.access_token);
  return getCurrentUser();
};

/* -------------------- USERNAME CHECK -------------------- */
export const checkUsernameAvailability = async (username) => {
  const res = await api.get(`/auth/check-username/${username.toLowerCase()}`);
  return res.data.available;
};

/* -------------------- EMAIL CHECK -------------------- */
export const checkEmailAvailability = async (email) => {
  const res = await api.get(`/auth/check-email/${email.toLowerCase()}`);
  return res.data.available;
};

/* -------------------- MANUAL SIGNUP -------------------- */
export const signupManual = async ({
  name,
  username,
  email,
  password,
  date_of_birth,
}) => {
  const res = await api.post("/auth/signup", {
    name,
    username,
    email,
    password,
    date_of_birth,
  });

  await saveToken(res.data.access_token);
  return getCurrentUser();
};

/* -------------------- MOOD STATS -------------------- */
export const getMoodStats = async () => {
  const res = await api.get("/mood/stats");
  return res.data;
};

/* -------------------- MOOD TREND -------------------- */
export const getMoodTrend = async (mode) => {
  try {
    const res = await api.get(`/mood/trend?mode=${mode}`);
    return res.data;
  } catch (err) {
    console.log("Trend API error:", err.response?.data || err.message);
    return [];
  }
};

/* -------------------- RECENT ACTIVITY -------------------- */
export const getRecentActivity = async () => {
  const res = await api.get("/mood/activity/recent");
  return res.data;
};

/* -------------------- LOG MOOD -------------------- */
export const logMood = async (mood) => {
  const res = await api.post("/mood/log", { mood });
  return res.data;
};

/* -------------------- CONTEXT DETECTION -------------------- */
export const getContext = async (latitude, longitude) => {
  const res = await api.get("/context", {
    params: {
      lat: latitude,
      lon: longitude,
    },
  });

  return res.data;
};

/* -------------------- GET RECOMMENDATIONS -------------------- */
export const getRecommendations = async ({
  mood,
  weather,
  timeOfDay,
  latitude,
  longitude,
}) => {
  try {
    const userId = await getUserId();
    const res = await api.get("/recommendations", {
      params: {
        mood,
        weather,
        time_of_day: timeOfDay,
        lat: latitude,
        lon: longitude,
        user_id: userId,
      },
    });
    return res.data;
  } catch (err) {
    console.log("Recommendation API error:", err.response?.data || err.message);
    return [];
  }
};

/* -------------------- GET USER ACTIVITY STATE -------------------- */
export const getUserActivities = async () => {
  const res = await api.get("/activities/my");
  return res.data;
};

/* -------------------- FAVOURITE ACTIVITY -------------------- */
export const addFavourite = async (activityId) => {
  const res = await api.post("/favourites", {
    activity_id: activityId,
  });

  return res.data;
};

export const getFavouriteState = async (activityId) => {
  const res = await api.get(`/favourites/${activityId}`);

  return res.data;
};

/* -------------------- REMOVE FAVOURITE -------------------- */
export const removeFavourite = async (activityId) => {
  const res = await api.delete(`/favourites/${activityId}`);
  return res.data;
};
/* -------------------- ACTIVITY FEEDBACK -------------------- */
export const getActivityFeedback = async (activityId) => {
  const res = await api.get(`/feedback/${activityId}`);
  return res.data;
};

export const sendActivityFeedback = async ({
  activityId,
  rating,
  feedback,
}) => {
  const res = await api.post("/feedback/", {
    activity_id: activityId,
    rating,
    feedback,
  });

  return res.data;
};
/* -------------------- LOG ACTIVITY OPEN -------------------- */
export const logActivityOpen = async (activityId) => {
  const res = await api.post(`/activities/log/${activityId}`);
  return res.data;
};

/* -------------------- TRACK INTERACTION -------------------- */
export const trackInteraction = async (payload) => {
  try {
    const userId = await getUserId();
    const deviceId = await getDeviceId();

    await api.post("/interactions", {
      user_id: userId,
      device_id: deviceId,
      ...payload,
    });
  } catch (err) {
    console.log("Track interaction error:", err.response?.data || err.message);
  }
};

/* -------------------- SEARCH ACTIVITIES -------------------- */
export const searchActivities = async (query) => {
  if (!query) return [];

  try {
    const res = await api.get(`/activities/search?q=${query}`);
    return res.data;
  } catch (err) {
    console.log("Search error:", err.response?.data || err.message);
    return [];
  }
};

/* -------------------- ACHIEVEMENTS -------------------- */
export const getAchievements = async () => {
  const res = await api.get("/achievements");
  return res.data;
};

export const uploadProfileImg = async (image) => {
  const formData = new FormData();

  formData.append("file", {
    uri: image.uri,
    name: `profile_${Date.now()}.jpg`,
    type: "image/jpeg",
  });

  const res = await api.post("/users/upload-profile-img", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  console.log("UPLOAD RESPONSE:", res.data);

  return res.data.profile_image;
};

/* -------------------- PROFILE -------------------- */
export const updateUserProfile = async (data) => {
  const res = await api.put("/users/me", data);
  return res.data;
};

/* -------------------- SETTINGS -------------------- */
export const getSettings = async () => {
  const res = await api.get("/users/settings");
  return res.data;
};

export const saveSettings = async (settings) => {
  const res = await api.put("/users/settings", settings);
  return res.data;
};

export default api;
