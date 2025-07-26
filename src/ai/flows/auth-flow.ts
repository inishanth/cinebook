
'use server';

/**
 * @fileOverview Authentication flows for handling user creation and login.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@/types';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const saltRounds = 10;

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

const CreateUserInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3, "Username must be at least 3 characters."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const createUserFlow = ai.defineFlow(
    {
        name: 'createUserFlow',
        inputSchema: CreateUserInputSchema,
        outputSchema: z.void(),
    },
    async ({ email, username, password }) => {
        const supabase = getSupabaseClient();
        
        const { data: existingUser, error: existingUserError } = await supabase
            .from('users')
            .select('user_id')
            .or(`email.eq.${email},username.eq.${username}`)
            .maybeSingle();

        if (existingUserError) {
            throw new Error(existingUserError.message || 'Failed to check for existing user.');
        }
        
        if (existingUser) {
            throw new Error('An account with this email or username already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const { error } = await supabase
            .from('users')
            .insert({
                email,
                username,
                password_hash: hashedPassword,
            });
        
        if (error) {
            throw new Error(error.message || 'Failed to create user account.');
        }
    }
);

export async function createUser(userData: Required<Pick<User, 'email' | 'username' | 'password'>>): Promise<void> {
    await createUserFlow(userData);
}


const LoginUserInputSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
});

const UserOutputSchema = z.object({
    id: z.number(),
    username: z.string(),
    email: z.string().email(),
    session_token: z.string(),
});

const loginUserFlow = ai.defineFlow(
    {
        name: 'loginUserFlow',
        inputSchema: LoginUserInputSchema,
        outputSchema: UserOutputSchema,
    },
    async ({ email, password, ipAddress, userAgent }) => {
        const supabase = getSupabaseClient();

        const logAudit = async (userId: number | null, success: boolean, failure_reason: string | null) => {
            await supabase.from('login_audit_log').insert({
                user_id: userId,
                ip_address: ipAddress,
                user_agent: userAgent,
                success,
                failure_reason,
            });
        };

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('user_id, username, email, password_hash')
            .eq('email', email)
            .maybeSingle();

        if (userError) {
             throw new Error(userError.message || 'Failed to retrieve user.');
        }

        if (!user) {
            await logAudit(null, false, 'Email address does not exist.');
            throw new Error('Email address does not exist.');
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) {
            await logAudit(user.user_id, false, 'Incorrect password.');
            throw new Error('Incorrect password.');
        }

        await logAudit(user.user_id, true, null);

        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                last_login_time: new Date().toISOString(),
                last_login_ip: ipAddress 
            })
            .eq('user_id', user.user_id);

        if (updateError) {
            console.error('Failed to update last login time/ip:', updateError.message);
        }

        const sessionToken = crypto.randomBytes(32).toString('hex');
        const { error: sessionError } = await supabase.from('sessions').insert({
            user_id: user.user_id,
            ip_address: ipAddress,
            user_agent: userAgent,
            session_token: sessionToken,
        });

        if (sessionError) {
            throw new Error(sessionError.message || 'Failed to create session.');
        }

        const { password_hash, ...userData } = user;
        return { 
            ...userData, 
            id: userData.user_id, 
            session_token: sessionToken 
        };
    }
);

export async function loginUser(credentials: z.infer<typeof LoginUserInputSchema>): Promise<z.infer<typeof UserOutputSchema>> {
    return await loginUserFlow(credentials);
}

const LogoutUserInputSchema = z.object({
  session_token: z.string(),
});

const logoutUserFlow = ai.defineFlow(
  {
    name: 'logoutUserFlow',
    inputSchema: LogoutUserInputSchema,
    outputSchema: z.void(),
  },
  async ({ session_token }) => {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('sessions')
      .update({
        logout_time: new Date().toISOString(),
        is_active: false,
      })
      .eq('session_token', session_token);
    
    if (error) {
        console.error('Failed to update session on logout', error.message);
    }
  }
);

export async function logoutUser(data: z.infer<typeof LogoutUserInputSchema>): Promise<void> {
    await logoutUserFlow(data);
}

const PasswordResetEmailInputSchema = z.object({
    email: z.string().email(),
});

const sendPasswordResetOtpFlow = ai.defineFlow({
    name: 'sendPasswordResetOtpFlow',
    inputSchema: PasswordResetEmailInputSchema,
    outputSchema: z.void(),
}, async ({ email }) => {
    const supabase = getSupabaseClient();
    
    // This will send an email with a link containing the OTP token.
    // The redirect URL should point to your dedicated reset password page.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) {
        console.error('Supabase password reset error:', error.message);
        // Do not throw the raw error to prevent leaking user existence info.
        // The UI will show a generic message regardless.
    }
});

export async function sendPasswordResetOtp(data: z.infer<typeof PasswordResetEmailInputSchema>): Promise<void> {
    await sendPasswordResetOtpFlow(data);
}


const ResetPasswordInputSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(1, "OTP must not be empty."),
  newPassword: z.string().min(6, "Password must be at least 6 characters."),
});

const resetPasswordWithOtpFlow = ai.defineFlow({
    name: 'resetPasswordWithOtpFlow',
    inputSchema: ResetPasswordInputSchema,
    outputSchema: z.void(),
}, async ({ email, otp, newPassword }) => {
    const supabase = getSupabaseClient();

    // This flow is now for a user who has clicked the link in the email.
    // Supabase handles token verification implicitly when the user lands on the redirectTo page.
    // For an API-based flow, we need to verify the OTP first.
    const { data: { session }, error: otpError } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'email', // Use 'email' for password resets initiated via email link
    });

    if (otpError || !session || !session.user) {
      console.error('Supabase OTP verification error:', otpError?.message);
      throw new Error("Invalid or expired OTP. Please request a new one.");
    }
    
    // IMPORTANT: After verifying the OTP, we must update the password in our custom `users` table.
    // This requires using the admin client to bypass RLS.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase service role key not found for password update.');
    }
    const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('email', email); // Use email to identify the user
    
    if (updateError) {
        console.error("Failed to update password in custom table:", updateError.message);
        throw new Error('Failed to update your password. Please try again.');
    }
});


export async function resetPassword(data: z.infer<typeof ResetPasswordInputSchema>): Promise<void> {
    await resetPasswordWithOtpFlow(data);
}
