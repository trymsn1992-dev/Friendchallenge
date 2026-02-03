-- Add Strava token columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS strava_access_token text,
ADD COLUMN IF NOT EXISTS strava_refresh_token text,
ADD COLUMN IF NOT EXISTS strava_expires_at bigint; -- Unix timestamp
