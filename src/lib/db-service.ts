
'use server';

import { sendEmail as sendEmailFlow } from '@/ai/flows/email-flow';

interface Email {
    to: string;
    subject: string;
    body: string;
}

// This service is now redundant as auth-flow directly calls the email flow.
// It can be removed in a future cleanup.
export async function sendEmail(email: Email): Promise<void> {
    try {
        await sendEmailFlow(email);
    } catch (error) {
        console.error("Error sending email from service:", error);
        throw error;
    }
}
