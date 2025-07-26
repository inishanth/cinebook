
'use server';

import { createClient } from '@supabase/supabase-js';
import { createUser as createUserFlow, loginUser as loginUserFlow } from '@/ai/flows/auth-flow';
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


// NOTE: You would need to create the 'users' table in your Supabase project.
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
*/
