import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser, BACKEND_URL } from "./api";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  /* -------------------- LOAD USER -------------------- */
  const loadUser = async () => {
    try {
      const cached = await AsyncStorage.getItem("user");

      if (cached) {
        setUser(JSON.parse(cached));
      }

      // always refreshf rom backend
      const fresh = await getCurrentUser();
      setUser(fresh);

      await AsyncStorage.setItem("user", JSON.stringify(fresh));
    } catch (e) {
      console.log("User load error:", e?.response.data || e.message);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  /* -------------------- UPDATE USER -------------------- */
  const updateUser = async (updates) => {
    const updated = { ...user, ...updates };

    setUser(updated);
    await AsyncStorage.setItem("user", JSON.stringify(updated));
  };

  /* -------------------- PROFILE IMAGE -------------------- */
  const getProfileImage = () => {
    if (!user?.profile_image) return null;

    let url = user.profile_image;

    if (url.includes("localhost")) {
      url = url.replace(
        "localhost:8000",
        "https://final-project-8-q2v4.onrender.com",
      );
    }

    if (!url.startsWith("http")) {
      url = `${BACKEND_URL}${url}`;
    }

    // cache
    return url;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        loadUser,
        getProfileImage,
        loadingUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
