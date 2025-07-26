
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
        // The flow will throw an error if the user exists or if insertion fails.
        // We can re-throw it to be caught by the UI.
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
        // Log the error but don't re-throw, as client-side logout should proceed regardless
        console.error('Failed to update session on server during logout:', error);
    }
}

export async function sendPasswordResetOtp(email: string): Promise<void> {
    try {
        await sendPasswordResetOtpFlow({ email });
    } catch (error) {
        throw error;
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

-- SQL for 'password_resets' table
CREATE TABLE password_resets (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE
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

*/
