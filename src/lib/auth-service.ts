
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

// NOTE: You would need to create the tables in your Supabase project.
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
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id) -- Only one active reset request per user
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


-- SQL for Supabase Edge function to send email
-- 1. Create a file `supabase/functions/send-email/index.ts`
-- 2. Add the following content to it:

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@3.4.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  try {
    const { to, subject, body } = await req.json();

    const { data, error } = await resend.emails.send({
      from: "CineBook <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: `<strong>${body}</strong>`,
    });

    if (error) {
      return new Response(JSON.stringify(error), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
})

-- 3. Add `RESEND_API_KEY` to your project's environment variables in Supabase.
-- 4. Deploy the function: `supabase functions deploy send-email`

*/
