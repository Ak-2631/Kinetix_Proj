-- ============================================================
-- Migration: Split Profiles into Doctors and Patients (Phase 6)
-- ============================================================

-- Step 1: Create dedicated doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL
);

-- Step 2: Create dedicated patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  rehab_focus TEXT
);

-- Step 3: Enable RLS on both tables
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Step 4: Add RLS Policies for Doctors
-- Doctors can do anything with their own row
CREATE POLICY "Doctors manage own profile"
  ON doctors FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Doctors can see patients they are linked to (assuming doctor_patient_links exists)
CREATE POLICY "Doctors can view linked patients"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctor_patient_links
      WHERE doctor_patient_links.patient_id = patients.id
      AND doctor_patient_links.doctor_id = auth.uid()
    )
  );

-- Step 5: Add RLS Policies for Patients
-- Patients can manage their own row
CREATE POLICY "Patients manage own profile"
  ON patients FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Step 6: Drop existing constraints referencing `profiles`
ALTER TABLE assigned_routines
  DROP CONSTRAINT IF EXISTS assigned_routines_doctor_id_fkey,
  DROP CONSTRAINT IF EXISTS assigned_routines_patient_id_fkey;

ALTER TABLE doctor_patient_links
  DROP CONSTRAINT IF EXISTS doctor_patient_links_doctor_id_fkey,
  DROP CONSTRAINT IF EXISTS doctor_patient_links_patient_id_fkey;

ALTER TABLE session_logs
  DROP CONSTRAINT IF EXISTS session_logs_patient_id_fkey;

-- Step 7: Add NEW constraints referencing specialized tables
ALTER TABLE assigned_routines
  ADD CONSTRAINT assigned_routines_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  ADD CONSTRAINT assigned_routines_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE doctor_patient_links
  ADD CONSTRAINT doctor_patient_links_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  ADD CONSTRAINT doctor_patient_links_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE session_logs
  ADD CONSTRAINT session_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- Step 8: (Optional) We can deprecate profiles later.
-- For now we just leave it so we don't break migrating data if need be.
-- DROP TABLE IF EXISTS profiles CASCADE;
