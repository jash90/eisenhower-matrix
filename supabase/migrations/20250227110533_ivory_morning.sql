/*
  # Add subscription support
  
  1. New Tables
    - `subscriptions`
      - Stores user subscription information
      - Links to Stripe customer and subscription IDs
      - Tracks subscription status and plan
    - `prices`
      - Stores available subscription plans
      - Links to Stripe price IDs
      - Includes plan details and features
  
  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
    
  3. Functions
    - Add function to handle Stripe webhooks
*/

-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM (
  'trialing',
  'active',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'past_due',
  'unpaid',
  'paused'
);

-- Create prices table
CREATE TABLE prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  description text,
  unit_amount bigint,
  currency text DEFAULT 'usd',
  type text DEFAULT 'recurring',
  interval text DEFAULT 'month',
  interval_count integer DEFAULT 1,
  trial_period_days integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Create subscriptions table
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  status subscription_status NOT NULL,
  price_id uuid REFERENCES prices,
  quantity integer,
  cancel_at_period_end boolean,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  ended_at timestamptz,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Add stripe columns to users
ALTER TABLE auth.users ADD COLUMN stripe_customer_id text UNIQUE;
ALTER TABLE auth.users ADD COLUMN is_subscribed boolean DEFAULT false;

-- RLS Policies

-- Prices: Allow read access to all authenticated users
CREATE POLICY "Allow authenticated users to read prices"
  ON prices
  FOR SELECT
  TO authenticated
  USING (true);

-- Subscriptions: Allow users to read their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle subscription status changes
CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user's subscription status
  UPDATE auth.users
  SET is_subscribed = (NEW.status = 'active' OR NEW.status = 'trialing')
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscription changes
CREATE TRIGGER on_subscription_status_change
  AFTER INSERT OR UPDATE OF status
  ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_change();

-- Insert initial subscription plans
INSERT INTO prices (stripe_price_id, description, unit_amount, currency, interval)
VALUES
  ('price_H1YvDwm6Al8DLy', 'Pro Monthly', 999, 'usd', 'month'),
  ('price_H1YvDwm6Al8DLz', 'Pro Yearly', 9999, 'usd', 'year');