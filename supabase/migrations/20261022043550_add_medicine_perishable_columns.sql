/*
# Add medicine and perishable metadata columns to donations

1. Modified Tables
- `donations`: add three new nullable columns to support medicine-specific info and perishable expiry tracking.
  - `medicine_name` (text): required for medicine donations, stores the drug/brand name.
  - `expiry_date` (date): required for medicine donations, stores the expiry date.
  - `perishable_expiry` (timestamptz): auto-computed for perishable food items (created_at + 36 hours).

2. Security
- No policy changes. Existing RLS policies already cover these columns since they're on the same table.

3. Notes
- All three columns are nullable so existing non-medicine donations remain valid.
- The frontend sets `perishable_expiry` to `now() + interval '36 hours'` (1.5 days) when
  category=Food and sub_category=Perishable.
- The frontend sets `medicine_name` and `expiry_date` when category=Medicine.
*/

ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS medicine_name text,
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS perishable_expiry timestamptz;
