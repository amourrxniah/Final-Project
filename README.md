# Moodsync - Context-Aware AI Activity Recommendations

## Project Overview

MoodSync is a mobile application build using React Native and Expo that provides personalised activity recommendations based on a user's mood, energy level, and environmental context (e.g., time of day and weather).

The system integrates a FastAPI backend to generalise intelligent recommendations and track user interactions over time.

---

## Core Features

- Mood-based activity recommendations
- Contet awareness (Weather, time, location)
- Activity feedback system (like/dislike)
- Mood tracking and statistics
- Achievement system
- Privacy-first design with consent system
- User profile with activity history

---

## System Architecture

- **Frontent:** React Native (Expo)
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Render)
- **Deployment:** Render (backend,) Expo (frontend)

---

## How to Run the App (User Guide)

### Option 1 - Recommended (Expo Go)

1. Clone the Repository

```bash
git clonehttps://github.com/amourrxniah/Final-Project.git
cd https://github.com/amourrxniah/Final-Project.git
```

---

2. Install Dependencies

```bash
npm install
```

3. Install **Expo Go** on your phone:
   - iOS: App Store
   - Android: Google Play

4. In the project folder **mobile**, run:

   ```bash
   npx expo start

   ```

5. Scan the QR code using:
   - Camera app (iOS)
   - Expo Go app (Android)

6. The app will open instantly.

### Test Usage

- You can use the app as a **guest user** using the credentials
  - USERNAME: guest1
  - PASSWORD: Password123@

- Or create an account / sign in
- No special credentials needed

### Backend API

The backend is deployed on Render:

https://final-project-8-q2v4.onrender.com

# IMPORTANT:

- The server may take **20-30 seconds** to respond on first use (free tier sleep mode)
- For demos, open:
  /docs

### Demonstrated Functionality
The system successfully demonstrates:
1. User inputs mood
2. Context is detected (Time, weather, location)
3. Bakcend generates reocmmendations
4. Activities are displayed
5. User can interact (like/dislike)
6. Data is stored and reflected in profile

This confirms **end to end functionality*

### Limitations
- The app is not fully polished (focus was on functionality)
- Backend hosted on Render free tier (slow initial response)
- Some features are simplified (e.g. AI logic, UI refinement)

### APK Build Limitation
An attempt was made to distribute the app as a downloadable Androi APK using Expo EAS Build. However, due to environment related build issues such as system conflicts and packaging errors, this was not successfully completed within the timeframe.

Additionally, requiring users to download an APK may introduce frition, whereas Expo Go provides a faster and more accessible testing experience.

Therefore, the application is delivered via Expo Go for demonstration purpses.

### Technical Decisions
- Expo was chosen for rapid mobile development
- FastAPI was used for its performance and simplicity
- Local storage is used to enhance privacy
- Render free tier is used for cost efficiency

### Testing Approach
Testing was conducted manually by:
- Logging different moods and verifying recommendations
- Testing API endpoints via frontend integration
- Validation user flows (login, activity feedback, profile updates)
- Ensuring data persistence and UI updates

### Demo Recording
The demo demonstrates:
- App launch via Expo Go
- Mood input
- Recommendation generation
- Activity interaction
- Profile + stats update

### Repository

