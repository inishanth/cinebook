
'use server';

/**
 * @fileOverview Authentication flows for handling user creation and login.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@/types';


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

// A simple (and not cryptographically secure) hashing function for demonstration.
// In a real-world application, you MUST use a library like bcrypt or argon2.
function simpleHash(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    // A simple way to make it look like a hash, not for security.
    return 'hashed_' + hash.toString(16) + '_hashed';
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
        
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingUser) {
            throw new Error('An account with this email already exists.');
        }

        const hashedPassword = simpleHash(password);

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

export async function createUser(userData: Omit<User, 'id' | 'password_hash'>): Promise<void> {
    await createUserFlow(userData);
}


const LoginUserInputSchema = z.object({
    username: z.string(),
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
    async ({ username, password }) => {
        const supabase = getSupabaseClient();
        const hashedPassword = simpleHash(password);

        const { data, error } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('username', username)
            .eq('password_hash', hashedPassword)
            .single();

        if (error || !data) {
            throw new Error('Invalid username or password.');
        }

        return data;
    }
);

export async function loginUser(credentials: z.infer<typeof LoginUserInputSchema>): Promise<z.infer<typeof UserOutputSchema>> {
    return await loginUserFlow(credentials);
}
