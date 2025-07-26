
'use server';

import { sendEmail as sendEmailFlow } from '@/ai/flows/email-flow';

interface Email {
    to: string;
    subject: string;
    body: string;
}

export async function sendEmail(email: Email): Promise<void> {
    try {
        await sendEmailFlow(email);
    } catch (error) {
        console.error("Error sending email from service:", error);
        throw error;
    }
}
