import React, { createContext, useContext, useState } from "react";

const MoodContext = createContext();

export function MoodProvider({ children }) {
  const [moodData, setMoodData] = useState({
    mood: null,
    weather: null,
    context: null,
    timeOfDay: null,
  });

  return (
    <MoodContext.Provider value={{ moodData, setMoodData }}>
      {children}
    </MoodContext.Provider>
  );
}

export const useMood = () => useContext(MoodContext);
