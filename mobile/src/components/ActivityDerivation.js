export const deriveMeta = (activity) => {
  const duration = activity.avg_duration
    ? `⏱ ${activity.avg_duration} min`
    : "⏱ Flexible";

  let energy = "⚖️ Balanced";
  if (activity.popularity > 0.75) energy = "🔋 Energising";
  if (activity.popularity < 0.45) energy = "🪫 Low effort";

  const social = activity.category_names?.some((c) =>
    ["bar", "cafe", "restaurant", "theatre"].some((k) => c.includes(k)),
  )
    ? "👥 Social"
    : "👤 Individual";

  return [duration, energy, social];
};

export const deriveTags = (categories = []) => {
  const joined = categories.join(" ").toLowerCase();
  const tags = [];

  if (joined.includes("park") || joined.includes("nature"))
    tags.push("Outdoor");
  if (joined.includes("museum") || joined.includes("gallery"))
    tags.push("Cultural");
  if (joined.includes("cinema") || joined.includes("theatre"))
    tags.push("Entertainment");
  if (joined.includes("cafe") || joined.includes("bar")) tags.push("Social");
  if (joined.includes("fitness") || joined.includes("sport"))
    tags.push("Active");
  if (joined.includes("library") || joined.includes("book"))
    tags.push("Relaxing");

  return tags;
};

export const deriveWhy = ({ mood, weather }) => {
  const moodMap = {
    low: "gently boosts your mood without feeling overwhelming",
    neutral: "keeps a nice balanced flow to your day",
    high: "matches your high energy and motivation",
  };

  const moodText = moodMap[mood] || "fits your current state well";
  const weatherText = weather
    ? ` It's especially suitable in ${String(weather).toLowerCase()} weather.`
    : "";

  return `This recommendation ${moodText}.${weatherText} It's a popular and reliable choice for this type of activity.`;
};

export const deriveBenefits = (categories = []) => {
  const joined = categories.join(" ").toLowerCase();

  const base = [
    "Supports mental wellbeing",
    "Encourages positive engagement",
    "Helps structure your time",
    "Improves overall mood",
  ];

  if (joined.includes("park") || joined.includes("nature")) {
    return [
      "Reduces stress and anxiety",
      "Encourages gentle movement",
      "Exposure to fresh air",
      "Improves emotional balance",
    ];
  }

  if (joined.includes("museum") || joined.includes("library")) {
    return [
      "Improves focus and concentration",
      "Encourages learning",
      "Provides a calm environment",
      "Stimulates curiosity",
    ];
  }

  if (joined.includes("cinema")) {
    return [
      "Provides mental escape",
      "Boosts mood through entertainment",
      "Low cognitive effort with high enjoyment",
      "Shared cultural experience",
    ];
  }

  return base;
};

export const deriveTips = (categories = []) => {
  const joined = categories.join(" ").toLowerCase();

  const base = [
    "Go at your own pace",
    "Take breaks if needed",
    "Stay present",
    "Enjoy the moment",
  ];

  if (joined.includes("library")) {
    return [
      "Choose something you genuinely enjoy",
      "Find a quiet space",
      "Silence notifications",
      "Bring a drink",
    ];
  }

  if (joined.includes("park")) {
    return [
      "Dress for the weather",
      "Bring water",
      "Take short rests",
      "Avoid peak hours",
    ];
  }

  return base;
};

export const findSimilarActivities = (current, all) => {
  const currentCats = (current.category_names || []).join(" ").toLowerCase();

  return all
    .filter((a) => a.id !== current.id)
    .map((a) => {
      const cats = (a.category_names || []).join(" ").toLowerCase();

      let score = 0;

      if (cats.includes("cafe") && currentCats.includes("cafe")) score++;
      if (cats.includes("restaurant") && currentCats.includes("restaurant"))
        score++;
      if (cats.includes("park") && currentCats.includes("park")) score++;
      if (cats.includes("museum") && currentCats.includes("museum")) score++;
      if (cats.includes("cinema") && currentCats.includes("cinema")) score++;

      return { ...a, score };
    })
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};
