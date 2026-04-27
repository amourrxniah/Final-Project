# Moodsync - Context-Aware AI Activity Recommendations

## Project Overview

MoodSync is a mobile application build using React Native and Expo that provides personalised activity recommendations based on a user's mood, energy level, and environmental context (e.g., time of day and weather).

The system integrates a FastAPI backend to generalise intelligent recommendations and track user interactions over time.

---

## Core Features

- Mood-based activity recommendations
- Contetn awareness (Weather, time, location)
- Activity feedback system (like/dislike)
- Mood tracking and statistics
- Achievement system
- Privacy-first design with consent system
- User profile with activity history

---

## System Architecture

- **Frontend:** React Native (Expo)
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Render)
- **Deployment:** Render (backend) Expo (frontend)

---

## How to Run the App (User Guide)

### Option 1 - Recommended (Expo Go)

1. Clone the Repository

```bash
git clone https://github.com/amourrxniah/Final-Project.git
cd Final Project
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
3. Backend generates recommendations
4. Activities are displayed
5. User can interact (like/dislike)
6. Data is stored and reflected in profile

This confirms **end_to_end functionality**

### Limitations

- The app is not fully polished (focus was on functionality)
- Backend hosted on Render free tier (slow initial response)
- Some features are simplified (e.g. AI logic, UI refinement)

### APK Build Limitation

An attempt was made to distribute the app as a downloadable Androi APK using Expo EAS Build. However, due to environment related build issues such as system conflicts and packaging errors, this was not successfully completed within the timeframe.

Additionally, requiring users to download an APK may introduce frition, whereas Expo Go provides a faster and more accessible testing experience.

Therefore, the application is delivered via Expo Go for demonstration purposes.

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

Watch the demo here:

- https://drive.google.com/file/d/1AUWXrb8MHLg6q7oYYX_gFq44rZAEDmTQ/view?usp=sharing

### Repository

GitHub Repository:
https://github.com/amourrxniah/Final-Project.git

### Test Cases

The following manual test cases were used to validate system functionality:

## Test Case 1 - Mood Recommendation Flow

**Input:** User selects mood (e.g., "low energy")
**Expected Output:** Relevant activities displayed
**Result:** PASS

---

## Test Case 2 - Context Detection

**Input:** Location Enabled
**Expected Output:** Weather + time was used in recommendations
**Result:** PASS

---

## Test Case 3 - Activity Feedback

**Input:** User likes/dislikes activity
**Expected Output:** Feedback stored and reflected in profile
**Result:** PASS

---

## Test Case 4 - Profile Data Update

**Input:** User interacts with activities
**Expected Output:** Stats and history updated
**Result:** PASS

---

## Test Case 5 - Consent System

**Input:** User accepts privacy policy
**Expected OutputL** Access granted to app
**Result:** PASS

### Conclusion

MoodSync successfully demonstrates a working prototype of a conext-aware recommendation system. While not fully production-ready, the core functionality works end to end and validates the project concept.
