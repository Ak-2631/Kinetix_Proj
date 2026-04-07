-- ============================================================
-- Migration 0003: Fix RLS Policies for Exercise Assignment
-- ============================================================
-- Root Cause Analysis:
-- 1. The existing "Doctor can insert assignments" policy ONLY checks
--    doctor_id = auth.uid(), which works. BUT if the doctor's session
--    was swapped during patient onboarding and not properly restored,
--    the insert will fail silently.
-- 2. There is NO "Doctor can update assignments" policy, so the
--    "Archive" action (UPDATE status to 'completed') was failing.
-- 3. The profiles SELECT policy restricts patients to their own
--    profile, but the doctor_patient_links join needs the doctor
--    to read PATIENT profiles — this is covered by the existing
--    "Doctors can read all profiles" policy.
-- ============================================================

-- Fix 1: Add missing UPDATE policy for doctors on assigned_routines
-- (Allows doctors to archive/complete routines they assigned)
CREATE POLICY "Doctor can update own assignments"
  ON assigned_routines
  FOR UPDATE
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

-- Fix 2: Add DELETE policy for doctors on assigned_routines
-- (Allows doctors to remove routines they assigned)
CREATE POLICY "Doctor can delete own assignments"
  ON assigned_routines
  FOR DELETE
  USING (doctor_id = auth.uid());

-- Fix 3: Ensure profiles can be READ by the doctor via joins
-- (The existing "Doctors can read all profiles" policy should cover this,
--  but if it was not applied, this is the fallback)
-- Note: Run this only if you see "permission denied" on profile joins.
-- Uncomment below if needed:
--
-- CREATE POLICY "Doctors can read all profiles (fallback)"
--   ON profiles FOR SELECT USING (
--     EXISTS (SELECT 1 FROM profiles AS p WHERE p.id = auth.uid() AND p.role = 'doctor')
--   );
