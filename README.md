# Kinetix

Kinetix is a fully functional Minimum Viable Product (MVP) built for rapid, modern post-operative rehabilitation tracking utilizing modern AI web elements. It is designed to seamlessly bridge the gap between patients recovering at home and the physicians monitoring their progress.

## 🚀 Features Implemented So Far

### 🔐 Full-Stack Architecture & Security (New!)
Upgraded from a static prototype to a secure full-stack application leveraging **Supabase**:
- **Role-Based Authentication:** Distinct login flows for Patients and Clinicians using `@supabase/supabase-js`. 
- **Protected Routing:** Secure wrappers (`react-router-dom`) ensure users can only access their designated dashboards.
- **Data Persistence:** Replaced mock state with live reads/writes to a PostgreSQL database.
- **Row Level Security (RLS):** Strict database policies guarantee medical data privacy by isolating patient records.

### 🎯 Patient Dashboard
The patient-facing side focuses on reducing friction, keeping users engaged, and capturing data effortlessly:
- **Dynamic Task Queue:** Automatically fetches the "Today's Routine" protocols assigned directly by the physician.
- **AI Vision Tracking:** Integrated Google MediaPipe (`@mediapipe/tasks-vision`) with the device webcam to track patient form and count repetitions in real-time.
- **Hands-Free Voice Navigation:** Utilized `react-speech-recognition` to allow users to control their session hands-free via voice commands ("start workout").
- **Gamification & Rewards:** Built-in daily rep goals, streak tracking, and visual rewards to keep patients motivated.

### 🩺 Doctor Dashboard
The clinical interface provides immediate, actionable insights and control:
- **Protocol Assignment:** An elegant UI allowing clinicians to assign specific rehabilitation exercises directly to a patient's queue.
- **AI Clinical Synthesis:** An automated reporting engine that processes raw patient data and generates a concise, natural-language clinical summary.
- **Data Visualization:** Clean layout highlighting critical elements such as average pain across the week and sessions completed.

### 🎨 Design & Architecture
- **Tech Stack:** React 19, Vite, Supabase, React Router.
- **UI/UX:** A deeply customized, ultra-premium dark theme employing glassmorphism and fluid micro-animations powered by `framer-motion`.
- **Icons:** Integrated `lucide-react` for crisp vector iconography and deployed modern typography (`Space Grotesk`) to enhance the cutting-edge feel of the platform.

## 🛠️ Getting Started

To run the platform locally:

1. **Database Setup:** 
   Execute the `supabase/migrations/0001_initial_schema.sql` script into your Supabase SQL Editor.
2. **Environment Variables:**
   Create a `.env.local` file inside `frontend-react` and populate your keys:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Run Application:**
   Navigate into the frontend directory and start the server.
   ```bash
   cd frontend-react
   npm install
   npm run dev
   ```

## 📂 Project Structure
- `/supabase/migrations/0001_initial_schema.sql` - Core DB architecture and RLS policies.
- `/src/pages/Landing.jsx` & `Login.jsx` - Dual-role authentication flow.
- `/src/pages/Dashboard.jsx` - The main Patient interface.
- `/src/pages/DoctorDashboard.jsx` - The Clinician interface.
- `/src/components/ProtectedRoute.jsx` - Route security and session verification.
- `/src/components/RehabVision.jsx` - The core AI Camera component for rep tracking.

---
*Built for the next generation of recovery.*
