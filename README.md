# Kinetix

Kinetix is a fully functional Minimum Viable Product (MVP) built for rapid, modern post-operative rehabilitation tracking utilizing modern AI web elements. It is designed to seamlessly bridge the gap between patients recovering at home and the physicians monitoring their progress.

## 🚀 Features Implemented So Far

### 🎯 Patient Dashboard
The patient-facing side focuses on reducing friction, keeping users engaged, and capturing data effortlessly:
- **AI Vision Tracking:** Integrated Google MediaPipe (`@mediapipe/tasks-vision`) with the device webcam to track patient form and count repetitions in real-time during rehabilitation routines.
- **Hands-Free Voice Navigation:** Utilized `react-speech-recognition` to allow users to control their session hands-free via voice commands like *"start workout"* or *"stop my exercises."*
- **Gamification & Rewards:** Built-in daily rep goals, streak tracking, and visual rewards (`react-confetti`) to keep patients motivated throughout their challenging rehab journey.
- **Interactive Pain Map:** A custom interactive visual interface allowing patients to precisely log their daily post-workout pain levels.

### 🩺 Doctor Dashboard
The clinical interface provides immediate, actionable insights rather than unorganized data:
- **AI Clinical Synthesis:** An automated reporting engine that processes raw patient data (weekly reps, pain trends, and session frequency) and generates a concise, natural-language clinical summary to save physicians time.
- **Data Visualization:** Clean, bold, metric-driven layout highlighting critical elements such as average pain across the week, sessions completed, and overall movement trends.

### 🎨 Design & Architecture
- **Tech Stack:** React 19, Vite.
- **UI/UX:** A deeply customized, ultra-premium dark theme. Employs modern web design paradigms including glassmorphism, dynamic gradients (cyan and purple accents), and fluid micro-animations powered by `framer-motion`.
- **Icons & Typography:** Integrated `lucide-react` for crisp vector iconography and deployed modern typography (`Space Grotesk`) to enhance the cutting-edge feel of the platform.

## 🛠️ Getting Started

To run the platform locally:

1. Navigate to the frontend directory:
   ```bash
   cd frontend-react
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Boot up the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure
- `/src/pages/Dashboard.jsx` - The main Patient interface.
- `/src/pages/DoctorDashboard.jsx` - The Clinician interface.
- `/src/components/RehabVision.jsx` - The core AI Camera component for rep tracking.
- `/src/components/Gamification.jsx` & `PainMap.jsx` - Interactive patient components.

---
*Built for the next generation of recovery.*
