# Kinetix AI Rehab Portal

Kinetix is a fully functional Minimum Viable Product (MVP) built for rapid, modern post-operative rehabilitation tracking utilizing modern AI web elements. It is designed to seamlessly bridge the gap between patients recovering at home and the physicians monitoring their progress.

## 🚀 Features

### 🔐 Authentication & Relational Security
A secure full-stack application powered by **Supabase** with production-grade data isolation:
- **Relational Architecture:** Distinct, deeply normalized Postgres tables for `doctors` and `patients` schema enforcing strict entity models.
- **Clinician Self-Registration:** Doctors and Patients can register securely from a unified login page, which splits and routes payloads instantly to the correct schema.
- **Protected Routing:** `ProtectedRoute` wrappers via `react-router-dom` ensure users can only access their designated dashboards.
- **Row Level Security (RLS):** Strict database policies across all 8 migration phases guarantee medical data privacy. Clinicians can securely query all registered patients to initiate linkages, while patients remain completely isolated.
- **Session Management:** Complex session toggling ensures RLS compliance while onboarding profiles entirely offline.

### 🩺 Doctor Dashboard — Clinical Command Center
The clinical interface provides immediate, actionable insights with full patient lifecycle management:

- **Personalized Workspaces:** Dynamically fetches and operates natively using the physician's authenticated token and metadata.
- **Live AI Clinical Synthesis Engine:** Instead of executing mock data, the system securely polls the last 7 days of actual patient `session_logs` activity, computationally tracks `painLevels` vs `weeklyReps`, and mathematically triggers a text-synthesis engine. This custom Doctor's Note is immediately pushed and synced into the patient's database layer.
- **Multi-Protocol Assignment Array:** Visual exercise picker with Lucide icons allows the clinician to batch-select multiple therapies at once, seamlessly parsing a payload of `assigned_routines` and firing them off concurrently.
- **B2B Patient Onboarding:**
  - Creates a new patient auth account natively (`supabase.auth.signUp`).
  - Stores their target `rehab_focus` into the secure `patients` schema.
  - Establishes a `doctor_patient_links` relationship instantly.
  - All seamlessly wrapped with automated background re-authentication.
- **Link Existing Patient Module:** Direct `.ilike()` email database polling to dynamically join orphaned patients to active rosters without friction.
- **Dynamic Roster Management:** Active / Completed tabs filtering patients by routine status.

### 🎯 Patient Dashboard
The patient-facing side focuses on reducing friction, keeping users engaged, and capturing data effortlessly:
- **Good Morning Native Integration:** Syncs their true registered name securely into the main header.
- **Doctor's Notes Portlet:** Exposes the Live AI Synthesis triggered strictly by their physician, projecting critical clinical notes securely onto their main view panel.
- **Dynamic Task Queue:** Automatically fetches "Today's Routine" protocols assigned by the physician from `assigned_routines`.
- **AI Vision Tracking:** Integrated Google MediaPipe (`@mediapipe/tasks-vision`) with the device webcam to track patient form and count repetitions in real-time.
- **Hands-Free Voice Navigation:** `react-speech-recognition` allows users to control their session hands-free via voice commands.
- **Gamification & Rewards:** Daily rep goals and visual targets.
- **Pain Reporting:** Interactive body pain map for patients to log discomfort levels per session.

### 🎨 Design & Architecture
- **Tech Stack:** React 19, Vite, Supabase (Auth + Postgres + RLS), React Router.
- **UI/UX:** Ultra-premium dark theme with glassmorphism, fluid micro-animations (`framer-motion`), and cyan/purple gradient accents.
- **Icons:** `lucide-react` for crisp vector iconography across all UI elements.
- **Typography:** `Space Grotesk` for a cutting-edge clinical aesthetic.

---

## 🗄️ Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `doctors` | Specialized clinician entity schema — `id` (UUID), `full_name`, `email` |
| `patients` | Specialized patient entity schema — `id` (UUID), `full_name`, `email`, `rehab_focus`, `clinical_summary` |
| `exercises_dictionary` | Master exercise library — `id`, `name`, `target_reps`, `lucide_icon_name` |
| `assigned_routines` | Doctor→Patient exercise assignments — `doctor_id`, `patient_id`, `exercise_id`, `status` (pending/completed) |
| `doctor_patient_links` | Relational doctor↔patient mapping — `doctor_id`, `patient_id`, `UNIQUE` constraint |
| `session_logs` | Deep analytic tracking — `patient_id`, `total_reps`, `pain_level` |

---

## 🛠️ Getting Started

### 1. Database Setup
Execute the generated migration scripts strictly sequentially in your Supabase SQL Editor:
```text
0001_initial_schema.sql
0002_doctor_patient_relations.sql
... (ensure all 8 are run sequentially)
0008_patient_clinical_summary.sql
```

### 2. Environment Variables
Create a `.env.local` file inside `frontend-react/`:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Application
```bash
cd frontend-react
npm install
npm run dev
```

---

## 📋 Development Phases Completed

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Landing page, patient dashboard, AI vision tracking, gamification | ✅ Complete |
| **Phase 2** | Supabase integration, auth flows, RLS policies, protected routing | ✅ Complete |
| **Phase 3** | B2B patient onboarding — profile insert, routine assignment, Auth-Juggling | ✅ Complete |
| **Phase 4** | Clinician registration, Active/Completed roster tabs, archive action | ✅ Complete |
| **Phase 5** | `doctor_patient_links` relational table, Link Existing Patient module | ✅ Complete |
| **Phase 6** | **Database Normalization**: Decoupling `profiles` into `doctors` & `patients` | ✅ Complete |
| **Phase 7** | **Multi-Assignment & Live DB AI Synthesis**: Real session metrics piped to patient dashboard | ✅ Complete |

---
*Built for the next generation of recovery.*
