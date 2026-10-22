/*
# CareDrop — initial schema

Creates the core tables for the CareDrop digital logistics platform:
a donor/NGO network that routes surplus food, medicine, and clothing
to people in need.

1. New Tables
- `profiles`: stores each user's display name, email, and role (donor or ngo).
  One row per authenticated user, keyed by `auth.users.id`.
- `donations`: surplus items posted by donors. NGOs can accept or reject them.
  Includes category, sub-category, quantity, description, geolocation, and status.
- `stats`: a singleton row holding global impact counters (waste prevented, people helped).

2. Security (Row Level Security)
- `profiles`: each authenticated user can read/update only their own profile row.
- `donations`:
  - Donors can read their own donations and insert new ones (donor_id = auth.uid()).
  - NGOs can read all donations with status pending (to see available surplus)
    and donations they have accepted (ngo_id = auth.uid()).
  - NGOs can update donations (accept/reject, setting ngo_id).
  - Donors can update their own donations.
  - DELETE restricted to owners.
- `stats`: readable by all authenticated users (public aggregate). Updates are
  server-side only (no client update policy) — counters are managed via RPC.

3. Notes
- `donations.donor_id` defaults to `auth.uid()` so inserts work without the client
  threading the user id through every call.
- `donations.location` is stored as a `jsonb` object `{ lat, lng }`.
- `stats` table has a single row enforced by a unique constraint on a constant.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'donor' CHECK (role IN ('donor', 'ngo')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
ON profiles FOR SELECT
TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  ngo_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('Food', 'Medicine', 'Clothing')),
  sub_category text NOT NULL,
  description text,
  quantity text NOT NULL,
  location jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Donors: read their own donations
DROP POLICY IF EXISTS "select_donations_donor" ON donations;
CREATE POLICY "select_donations_donor"
ON donations FOR SELECT
TO authenticated
USING (
  donor_id = auth.uid()
  OR (status = 'pending')
  OR (status = 'accepted' AND ngo_id = auth.uid())
);

-- Donors: insert their own donations
DROP POLICY IF EXISTS "insert_donations_donor" ON donations;
CREATE POLICY "insert_donations_donor"
ON donations FOR INSERT
TO authenticated
WITH CHECK (donor_id = auth.uid());

-- Donors + NGOs: update. Donors can update their own; NGOs can accept/reject (setting ngo_id + status).
DROP POLICY IF EXISTS "update_donations_owner_or_ngo" ON donations;
CREATE POLICY "update_donations_owner_or_ngo"
ON donations FOR UPDATE
TO authenticated
USING (
  donor_id = auth.uid()
  OR status = 'pending'
)
WITH CHECK (
  donor_id = auth.uid()
  OR ngo_id = auth.uid()
);

-- Donors can delete their own donations
DROP POLICY IF EXISTS "delete_donations_owner" ON donations;
CREATE POLICY "delete_donations_owner"
ON donations FOR DELETE
TO authenticated
USING (donor_id = auth.uid());

-- Stats table (singleton)
CREATE TABLE IF NOT EXISTS stats (
  id int PRIMARY KEY DEFAULT 1,
  waste_stopped int NOT NULL DEFAULT 0,
  people_helped int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read stats
DROP POLICY IF EXISTS "read_stats" ON stats;
CREATE POLICY "read_stats"
ON stats FOR SELECT
TO authenticated USING (true);

-- RPC to increment stats when an NGO accepts a donation
CREATE OR REPLACE FUNCTION increment_stats()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO stats (id, waste_stopped, people_helped)
  VALUES (1, 15, 3)
  ON CONFLICT (id) DO UPDATE
  SET waste_stopped = stats.waste_stopped + 15,
      people_helped = stats.people_helped + 3,
      updated_at = now();
$$;

GRANT EXECUTE ON FUNCTION increment_stats() TO authenticated;

-- Index for pending donation queries
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_ngo ON donations(ngo_id);
