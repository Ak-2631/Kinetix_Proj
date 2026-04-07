-- Create custom role enum
CREATE TYPE user_role AS ENUM ('patient', 'doctor');

-- Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  full_name TEXT
);

-- Exercises Dictionary Table
CREATE TABLE exercises_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lucide_icon_name TEXT NOT NULL,
  target_reps INTEGER NOT NULL,
  target_angle INTEGER
);

-- Assigned Routines Table
CREATE TABLE assigned_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises_dictionary(id) ON DELETE CASCADE NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed'))
);

-- Session Logs Table
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_reps INTEGER NOT NULL,
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  ai_summary TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS Policies
-- ----------------------------------------------------

-- Profiles
CREATE POLICY "Users can read own profile" 
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Doctors can read all profiles" 
ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles AS p WHERE p.id = auth.uid() AND p.role = 'doctor')
);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Exercises Dictionary
CREATE POLICY "Public read for dictionary" 
ON exercises_dictionary FOR SELECT USING (true); -- Patients and Doctors need to read exercises

CREATE POLICY "Only doctors can modify dictionary" 
ON exercises_dictionary FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'doctor')
);

-- Assigned Routines
CREATE POLICY "Patient can read own routine" 
ON assigned_routines FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Patient can update own routine (to complete)" 
ON assigned_routines FOR UPDATE USING (patient_id = auth.uid());

CREATE POLICY "Doctor can read own assignments" 
ON assigned_routines FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctor can insert assignments" 
ON assigned_routines FOR INSERT WITH CHECK (doctor_id = auth.uid());

-- Session Logs
CREATE POLICY "Patient can insert session logs" 
ON session_logs FOR INSERT WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patient can read own session logs" 
ON session_logs FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Doctor can read session logs" 
ON session_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'doctor')
);

-- ----------------------------------------------------
-- Seed Initial Data
-- ----------------------------------------------------
INSERT INTO exercises_dictionary (name, description, lucide_icon_name, target_reps, target_angle) VALUES
('Knee Extension', 'Straighten your leg completely, hold for 3 seconds.', 'Activity', 15, 180),
('Squats', 'Bend knees keeping back straight, lower until thighs are parallel to ground.', 'ActivitySquare', 12, 90),
('Leg Raises', 'Lift leg keeping it straight, hold for 2 seconds.', 'ArrowUpCircle', 15, 45),
('Ankle Pumps', 'Pump ankles up and down to improve circulation.', 'RotateCw', 20, 0),
('Wall Slides', 'Slide down against wall until knees are bent, hold for 5 seconds.', 'ArrowDownCircle', 10, 90);
