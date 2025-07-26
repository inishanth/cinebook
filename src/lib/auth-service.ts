
'use server';

import { createClient } from '@supabase/supabase-js';
import { createUser as createUserFlow, loginUser as loginUserFlow, logoutUser as logoutUserFlow, sendPasswordResetOtp as sendPasswordResetOtpFlow, resetPassword as resetPasswordFlow } from '@/ai/flows/auth-flow';
import type { User } from '@/types';
import { headers } from 'next/headers';

let supabase: ReturnType<typeof createClient>;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    if (!process.env.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_ANON_KEY environment variable is not set');
    }
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return supabase;
}

export async function createUser(userData: Required<Pick<User, 'email' | 'username' | 'password'>>): Promise<void> {
    try {
        await createUserFlow(userData);
    } catch (error) {
        throw error;
    }
}

export async function loginUser(credentials: Pick<User, 'email' | 'password'>): Promise<Omit<User, 'password' | 'password_hash'> & { session_token: string }> {
    try {
        const headersList = headers();
        const ipAddress = headersList.get('x-forwarded-for') || 'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';
        return await loginUserFlow({ ...credentials, ipAddress, userAgent });
    } catch (error) {
        throw error;
    }
}

export async function logoutUser(session_token: string): Promise<void> {
    try {
        await logoutUserFlow({ session_token });
    } catch (error) {
        console.error('Failed to update session on server during logout:', error);
    }
}

export async function sendPasswordResetOtp(email: string): Promise<void> {
    try {
        await sendPasswordResetOtpFlow({ email });
    } catch (error) {
        // The flow is designed to not reveal if an email exists.
        // We can swallow the error here and let the UI show a generic message.
        console.error("Password reset OTP flow failed but we are not throwing to the client", error);
    }
}

export async function resetPassword(data: {email: string, otp: string, newPassword: string}): Promise<void> {
    try {
        await resetPasswordFlow(data);
    } catch (error) {
        throw error;
    }
}

// NOTE: To enable authentication, you must create the following tables in your Supabase project.
// You can do this by navigating to the SQL Editor in your Supabase dashboard and running the SQL commands below.
/*
-- SQL for 'users' table
CREATE TABLE users (
  user_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_time TIMESTAMPTZ,
  last_login_ip TEXT
);

-- SQL for 'sessions' table
CREATE TABLE sessions (
    session_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    logout_time TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- SQL for 'login_audit_log' table
CREATE TABLE login_audit_log (
    log_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT,
    ip_address TEXT,
    user_agent TEXT,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN NOT NULL,
    failure_reason TEXT
);

-- This new flow relies on Supabase's built-in auth, which uses the `auth.users` table.
-- The custom tables above are for storing application-specific user data.
-- Ensure your Supabase project has Auth enabled.


-- FIX FOR Supabase Query Error:
-- If you are seeing errors in the app related to fetching data from Supabase,
-- you may need to enable read access for your public tables.
-- Navigate to the SQL Editor in your Supabase dashboard and run the following commands:

ALTER TABLE movies REPLICA IDENTITY FULL;
ALTER TABLE genres REPLICA IDENTITY FULL;
ALTER TABLE movie_genres REPLICA IDENTITY FULL;
ALTER TABLE cast_members REPLICA IDENTITY FULL;
ALTER TABLE movie_cast REPLICA IDENTITY FULL;

CREATE POLICY "Enable read access for all users" ON public.movies
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable read access for all users" ON public.genres
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable read access for all users" ON public.movie_genres
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable read access for all users" ON public.cast_members
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable read access for all users" ON public.movie_cast
AS PERMISSIVE FOR SELECT
TO public
USING (true);
*/
