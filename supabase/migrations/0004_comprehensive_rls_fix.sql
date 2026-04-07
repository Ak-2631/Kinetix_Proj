-- ============================================================
-- Migration 0004: Comprehensive RLS Policy Fixes
-- ============================================================
-- ROOT CAUSE ANALYSIS:
--
-- ISSUE 1 — "Patient not found by email":
--   The `profiles` table has two SELECT policies:
--     a) "Users can read own profile" → auth.uid() = id
--     b) "Doctors can read all profiles" → EXISTS subquery checking role='doctor'
--   The problem: Policy (b) uses a RECURSIVE subquery on the `profiles` table
--   itself. When RLS is enabled, the subquery ALSO gets RLS-filtered, creating
--   a circular dependency that can silently fail.
--   FIX: Use auth.jwt() ->> 'role' or a simpler check that doesn't recurse.
--   For a hackathon, safest fix: create a SECURITY DEFINER function to check role.
--
-- ISSUE 2 — "Cannot assign exercises":
--   The INSERT policy "Doctor can insert assignments" WITH CHECK (doctor_id = auth.uid())
--   is correct. But if the doctor's session was swapped during onboarding and
--   NOT properly restored, auth.uid() won't match. Additionally, the UPDATE
--   policy for doctors was MISSING entirely (added in 0003).
--
-- This migration drops and recreates problematic policies with cleaner logic.
-- ============================================================

-- ── STEP 1: Create a SECURITY DEFINER function to safely check role ──
-- This bypasses RLS on profiles when checking the current user's role,
-- breaking the circular dependency.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$;

-- ── STEP 2: Fix profiles SELECT policies ──
-- Drop the old recursive policy and replace with one using the safe function
DROP POLICY IF EXISTS "Doctors can read all profiles" ON profiles;

CREATE POLICY "Doctors can read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id                         -- users can always read own profile
    OR public.get_my_role() = 'doctor'      -- doctors can read ALL profiles
  );

-- ── STEP 3: Ensure assigned_routines has all necessary policies ──
-- These may already exist from 0001/0003, so we use IF NOT EXISTS pattern
-- by dropping and recreating to be idempotent.

-- Doctor INSERT (should exist from 0001, but ensure it's correct)
DROP POLICY IF EXISTS "Doctor can insert assignments" ON assigned_routines;
CREATE POLICY "Doctor can insert assignments"
  ON assigned_routines FOR INSERT
  WITH CHECK (doctor_id = auth.uid());

-- Doctor SELECT (should exist from 0001)
DROP POLICY IF EXISTS "Doctor can read own assignments" ON assigned_routines;
CREATE POLICY "Doctor can read own assignments"
  ON assigned_routines FOR SELECT
  USING (doctor_id = auth.uid());

-- Doctor UPDATE (was missing, may have been added in 0003)
DROP POLICY IF EXISTS "Doctor can update own assignments" ON assigned_routines;
CREATE POLICY "Doctor can update own assignments"
  ON assigned_routines FOR UPDATE
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

-- Doctor DELETE
DROP POLICY IF EXISTS "Doctor can delete own assignments" ON assigned_routines;
CREATE POLICY "Doctor can delete own assignments"
  ON assigned_routines FOR DELETE
  USING (doctor_id = auth.uid());

-- Patient SELECT (should exist from 0001)
DROP POLICY IF EXISTS "Patient can read own routine" ON assigned_routines;
CREATE POLICY "Patient can read own routine"
  ON assigned_routines FOR SELECT
  USING (patient_id = auth.uid());

-- Patient UPDATE (should exist from 0001)
DROP POLICY IF EXISTS "Patient can update own routine (to complete)" ON assigned_routines;
CREATE POLICY "Patient can update own routine (to complete)"
  ON assigned_routines FOR UPDATE
  USING (patient_id = auth.uid());

-- ── STEP 4: Ensure doctor_patient_links policies are correct ──
DROP POLICY IF EXISTS "Doctors can manage their patient links" ON doctor_patient_links;
CREATE POLICY "Doctors can manage their patient links"
  ON doctor_patient_links FOR ALL
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

DROP POLICY IF EXISTS "Patients can view their doctor links" ON doctor_patient_links;
CREATE POLICY "Patients can view their doctor links"
  ON doctor_patient_links FOR SELECT
  USING (patient_id = auth.uid());
