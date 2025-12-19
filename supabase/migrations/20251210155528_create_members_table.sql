/*
  # Create Members Table for Gym Management

  1. New Tables
    - `members`
      - `id` (uuid, primary key) - Auto-generated unique identifier
      - `member_id` (text, unique) - Custom member ID
      - `name` (text) - Member name
      - `date_of_joining` (date) - Date when member joined
      - `age` (integer) - Member age
      - `height` (numeric) - Member height in cm
      - `weight` (numeric) - Member weight in kg
      - `blood_group` (text) - Blood group
      - `contact_number` (text) - Contact phone number
      - `occupation` (text) - Member occupation
      - `address` (text) - Member address
      - `alcoholic` (boolean) - Whether member consumes alcohol
      - `smoking_habit` (boolean) - Whether member smokes
      - `teetotaler` (boolean) - Whether member is teetotaler
      - `package` (text) - Selected package type
      - `no_of_months` (integer) - Package duration in months
      - `due_date` (date) - Membership expiry date (auto-calculated)
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `members` table
    - Add policy for public access (for demo purposes - adjust as needed)

  3. Notes
    - Due date is automatically calculated from date_of_joining + no_of_months
    - Member status is derived from due_date for filtering (Active/Expiring/Expired)
*/

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text UNIQUE NOT NULL,
  name text NOT NULL,
  date_of_joining date NOT NULL DEFAULT CURRENT_DATE,
  age integer NOT NULL,
  height numeric NOT NULL,
  weight numeric NOT NULL,
  blood_group text NOT NULL,
  contact_number text NOT NULL,
  address text NOT NULL,
  alcoholic boolean DEFAULT false,
  smoking_habit boolean DEFAULT false,
  teetotaler boolean DEFAULT false,
  package text NOT NULL,
  no_of_months integer NOT NULL,
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to members"
  ON members
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access to members"
  ON members
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access to members"
  ON members
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to members"
  ON members
  FOR DELETE
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_members_due_date ON members(due_date);
CREATE INDEX IF NOT EXISTS idx_members_member_id ON members(member_id);