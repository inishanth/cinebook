
'use server';

/**
 * @fileOverview Authentication flows for handling user creation and login.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@/types';
import bcrypt from 'bcrypt';

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
  username: z.string(),
  password: z.string(),
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
            .select('id')
            .or(`email.eq.${email},username.eq.${username}`)
            .single();

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
});

const UserOutputSchema = z.object({
    id: z.number(),
    username: z.string(),
    email: z.string().email(),
});

const loginUserFlow = ai.defineFlow(
    {
        name: 'loginUserFlow',
        inputSchema: LoginUserInputSchema,
        outputSchema: UserOutputSchema,
    },
    async ({ email, password }) => {
        const supabase = getSupabaseClient();

        // Step 1: Check if the user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, username, email, password_hash')
            .eq('email', email)
            .single();

        if (userError || !user) {
            throw new Error('Email address does not exist.');
        }

        // Step 2: If user exists, compare the password
        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) {
            throw new Error('Incorrect password.');
        }

        // Return user data, excluding the password hash
        const { password_hash, ...userData } = user;
        return userData;
    }
);

export async function loginUser(credentials: z.infer<typeof LoginUserInputSchema>): Promise<z.infer<typeof UserOutputSchema>> {
    return await loginUserFlow(credentials);
}
