-- ============================================================
-- Migration: Migrate Data From Profiles to New Tables (V2)
-- ============================================================

-- Safely copy over all existing doctors
-- We use COALESCE to handle legacy accounts that were created
-- before the email column was added to the profiles table.
INSERT INTO doctors (id, full_name, email)
SELECT 
  id, 
  full_name, 
  COALESCE(email, 'placeholder_' || substring(id::text from 1 for 8) || '@kinetix.com')
FROM profiles 
WHERE role = 'doctor'
ON CONFLICT (id) DO NOTHING;

-- Safely copy over all existing patients
INSERT INTO patients (id, full_name, email)
SELECT 
  id, 
  full_name, 
  COALESCE(email, 'placeholder_' || substring(id::text from 1 for 8) || '@kinetix.com')
FROM profiles 
WHERE role = 'patient'
ON CONFLICT (id) DO NOTHING;
