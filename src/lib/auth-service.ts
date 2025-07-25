
'use server';

import { createClient } from '@supabase/supabase-js';
import { generateOtp, verifyOtp } from '@/ai/flows/auth-flow';
import type { User } from '@/types';

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

async function handleSupabaseError<T>(response: { data: T; error: any }): Promise<T> {
  if (response.error) {
    console.error('Supabase Query Error:', response.error);
    throw new Error(`Supabase error: ${response.error.message}`);
  }
  return response.data;
}

// NOTE: In a real application, this would use a proper email service.
// For this prototype, we are only logging the OTP to the console.
async function sendOtpByEmail(email: string, otp: string) {
  console.log(`[Auth Service] Sending OTP to ${email}: ${otp}`);
  // This is where you would integrate with an email sending service like SendGrid, Mailgun, etc.
  // For now, we just simulate the sending process.
  return Promise.resolve();
}

export async function sendOtp(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
  
  if (existingUser) {
    throw new Error('An account with this email already exists.');
  }

  const { otp, expiresAt } = await generateOtp({ email });

  await sendOtpByEmail(email, otp);

  const { error } = await supabase.from('otps').upsert({
    email,
    otp,
    expires_at: expiresAt,
  }, { onConflict: 'email' });

  if (error) {
    throw new Error('Could not save OTP. Please try again.');
  }
}

export async function verifyOtpAndCreateUser(userData: Omit<User, 'id'> & { otp: string }): Promise<void> {
    const supabase = getSupabaseClient();
    const { email, username, password, otp } = userData;

    const isValid = await verifyOtp({ email, otp });

    if (!isValid) {
        throw new Error('Invalid or expired OTP. Please try again.');
    }

    // In a real app, you MUST hash the password before storing it.
    // Supabase Auth handles this automatically, but for a manual user table:
    // const hashedPassword = await hashPassword(password);
    const { data, error } = await supabase
        .from('users')
        .insert({
            email,
            username,
            password, // Storing plain text password - DO NOT DO THIS IN PRODUCTION
        })
        .select()
        .single();
    
    if (error || !data) {
        throw new Error(error?.message || 'Failed to create user account.');
    }
    
    // Delete the OTP after successful use
    await supabase.from('otps').delete().eq('email', email);
}

// NOTE: You would need to create the 'users' and 'otps' tables in your Supabase project.
/*
-- SQL for 'users' table
CREATE TABLE users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SQL for 'otps' table
CREATE TABLE otps (
  email TEXT PRIMARY KEY,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/
