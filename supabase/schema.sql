-- Supabase Schema for Meme Booth Credits System
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- This table syncs with Supabase Auth users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
-- Logs all credit changes (purchases, generations, refunds)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'generation', 'refund')),
  amount INTEGER NOT NULL,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user transaction lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- ============================================
-- PURCHASES TABLE
-- ============================================
-- Tracks Stripe checkout sessions and payment status
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL,
  amount_paid INTEGER NOT NULL, -- in cents
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session_id ON public.purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);

-- ============================================
-- RATE LIMITING TABLE
-- ============================================
-- Tracks rate limits for generations and signups
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- user_id or IP address
  action TEXT NOT NULL CHECK (action IN ('generation', 'signup', 'failed_payment')),
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- USERS TABLE POLICIES
-- Users can only view and update their own data
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do everything (for webhooks and API routes)
CREATE POLICY "Service role has full access to users"
  ON public.users FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- TRANSACTIONS TABLE POLICIES
-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert transactions (via API routes)
CREATE POLICY "Service role can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to transactions"
  ON public.transactions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- PURCHASES TABLE POLICIES
-- Users can only view their own purchases
CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can modify purchases (via webhooks)
CREATE POLICY "Service role has full access to purchases"
  ON public.purchases FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- RATE LIMITS TABLE POLICIES
-- Only service role can access rate limits
CREATE POLICY "Service role has full access to rate_limits"
  ON public.rate_limits FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to create a user record when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits)
  VALUES (NEW.id, NEW.email, 2)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to deduct credits (with validation)
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, new_credits INTEGER, error_message TEXT) AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO v_current_credits
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  IF v_current_credits <= 0 THEN
    RETURN QUERY SELECT FALSE, v_current_credits, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  -- Deduct credit
  UPDATE public.users
  SET credits = credits - 1
  WHERE id = p_user_id;

  -- Log transaction
  INSERT INTO public.transactions (user_id, type, amount)
  VALUES (p_user_id, 'generation', -1);

  RETURN QUERY SELECT TRUE, v_current_credits - 1, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits (for purchases and refunds)
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_stripe_payment_id TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, new_credits INTEGER, error_message TEXT) AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Validate type
  IF p_type NOT IN ('purchase', 'refund') THEN
    RETURN QUERY SELECT FALSE, 0, 'Invalid transaction type'::TEXT;
    RETURN;
  END IF;

  -- Get current credits with row lock
  SELECT credits INTO v_current_credits
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  -- Add credits
  UPDATE public.users
  SET credits = credits + p_amount
  WHERE id = p_user_id;

  -- Log transaction
  INSERT INTO public.transactions (user_id, type, amount, stripe_payment_id)
  VALUES (p_user_id, p_type, p_amount, p_stripe_payment_id);

  RETURN QUERY SELECT TRUE, v_current_credits + p_amount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_count INTEGER,
  p_window_minutes INTEGER
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, reset_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_count INTEGER;
  v_reset_at TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Get current count within window
  SELECT COALESCE(SUM(count), 0) INTO v_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND action = p_action
    AND window_start > v_window_start;

  v_reset_at := NOW() + (p_window_minutes || ' minutes')::INTERVAL;

  IF v_count >= p_max_count THEN
    RETURN QUERY SELECT FALSE, v_count, v_reset_at;
    RETURN;
  END IF;

  -- Increment or insert rate limit record
  INSERT INTO public.rate_limits (identifier, action, count, window_start)
  VALUES (p_identifier, p_action, 1, NOW())
  ON CONFLICT DO NOTHING;

  -- If insert failed (race condition), increment existing
  IF NOT FOUND THEN
    UPDATE public.rate_limits
    SET count = count + 1
    WHERE identifier = p_identifier
      AND action = p_action
      AND window_start > v_window_start;
  END IF;

  RETURN QUERY SELECT TRUE, v_count + 1, v_reset_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old rate limit records (run periodically via cron)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '2 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS FOR SERVICE ROLE
-- ============================================
-- These allow API routes using service role key to access tables

GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.transactions TO service_role;
GRANT ALL ON public.purchases TO service_role;
GRANT ALL ON public.rate_limits TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credit TO service_role;
GRANT EXECUTE ON FUNCTION public.add_credits TO service_role;
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits TO service_role;
