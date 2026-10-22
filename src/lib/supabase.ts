import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Role = 'donor' | 'ngo';

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
};

export type DonationStatus = 'pending' | 'accepted' | 'rejected';

export type Donation = {
  id: string;
  donor_id: string;
  ngo_id: string | null;
  category: 'Food' | 'Medicine' | 'Clothing';
  sub_category: string;
  description: string | null;
  quantity: string;
  location: { lat: number; lng: number } | null;
  status: DonationStatus;
  created_at: string;
  resolved_at: string | null;
  medicine_name: string | null;
  expiry_date: string | null;
  perishable_expiry: string | null;
};

export type Stats = {
  id: number;
  waste_stopped: number;
  people_helped: number;
  updated_at: string;
};
