-- ============================================================
-- Migration 0002: Doctor-Patient Relations & Profile Email
-- ============================================================

-- Step 1: Add email column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Step 2: Create the doctor_patient_links table
CREATE TABLE IF NOT EXISTS doctor_patient_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, patient_id)
);

-- Step 3: Enable RLS
ALTER TABLE doctor_patient_links ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies

-- Doctors can do everything on their own links
CREATE POLICY "Doctors can manage their patient links"
  ON doctor_patient_links
  FOR ALL
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

-- Patients can view links where they are the patient
CREATE POLICY "Patients can view their doctor links"
  ON doctor_patient_links
  FOR SELECT
  USING (patient_id = auth.uid());
