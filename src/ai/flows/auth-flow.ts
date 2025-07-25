
'use server';

/**
 * @fileOverview Authentication flows for handling OTP generation and verification.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// OTP generation logic
const generateOtpFlow = ai.defineFlow(
  {
    name: 'generateOtpFlow',
    inputSchema: z.object({ email: z.string().email() }),
    outputSchema: z.object({
      otp: z.string(),
      expiresAt: z.string(),
    }),
  },
  async ({ email }) => {
    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // OTP expires in 10 minutes
    
    return { otp, expiresAt };
  }
);

export async function generateOtp(input: { email: string }): Promise<{ otp: string; expiresAt: string; }> {
    return generateOtpFlow(input);
}


// OTP verification logic
let supabase: ReturnType<typeof createClient>;
function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error('Supabase credentials not found in environment variables.');
    }
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return supabase;
}

const verifyOtpFlow = ai.defineFlow(
    {
        name: 'verifyOtpFlow',
        inputSchema: z.object({
            email: z.string().email(),
            otp: z.string().length(6),
        }),
        outputSchema: z.boolean(),
    },
    async ({ email, otp }) => {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('otps')
            .select('otp, expires_at')
            .eq('email', email)
            .single();

        if (error || !data) {
            console.error('OTP verification error:', error);
            return false;
        }

        const isOtpValid = data.otp === otp;
        const isOtpExpired = new Date() > new Date(data.expires_at);

        if (!isOtpValid || isOtpExpired) {
            return false;
        }

        return true;
    }
);

export async function verifyOtp(input: { email: string; otp: string }): Promise<boolean> {
    return verifyOtpFlow(input);
}
