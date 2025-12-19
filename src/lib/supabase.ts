import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Member {
  id: string;
  member_id: string;
  name: string;
  date_of_joining: string;
  age: number;
  height: number;
  weight: number;
  blood_group: string;
  contact_number: string;
  occupation: string;
  address: string;
  alcoholic: boolean;
  smoking_habit: boolean;
  teetotaler: boolean;
  package: string;
  no_of_months: number;
  due_date: string;
  created_at?: string;
  updated_at?: string;
}
