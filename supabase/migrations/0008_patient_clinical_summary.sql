-- ============================================================
-- Migration: Add Clinical Summary Field (Phase 7)
-- ============================================================

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS clinical_summary TEXT;
