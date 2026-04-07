-- ============================================================
-- Migration: Fix Patient Search RLS
-- ============================================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Doctors can view linked patients" ON patients;

-- Create a more permissive policy allowing doctors to see ALL patients
-- This is strictly necessary so clinicians can search for patients by email
-- in order to link them.
CREATE POLICY "Doctors can view all patients"
  ON patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM doctors
      WHERE doctors.id = auth.uid()
    )
  );
