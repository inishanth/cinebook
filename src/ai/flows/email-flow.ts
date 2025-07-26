
'use server';
/**
 * @fileOverview A flow for sending emails.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
});

let supabase: ReturnType<typeof createClient>;
function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials for admin not found in environment variables.');
    }
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
  }
  return supabase;
}

const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: EmailSchema,
    outputSchema: z.void(),
  },
  async (email) => {
    // This flow requires the Resend integration, which is not currently configured.
    // For now, we will log the email to the console.
    // In a real application, you would integrate a service like Resend here.
    console.log('---- Sending Email ----');
    console.log(`To: ${email.to}`);
    console.log(`Subject: ${email.subject}`);
    console.log(`Body: ${email.body}`);
    console.log('-----------------------');
    
    // The code below is for when an email service is integrated.
    /*
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.functions.invoke('send-email', {
        body: email,
    });
    
    if (error) {
        console.error('Error sending email via Supabase function:', error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
    
    return data;
    */
  }
);

export async function sendEmail(email: z.infer<typeof EmailSchema>): Promise<void> {
    return sendEmailFlow(email);
}
