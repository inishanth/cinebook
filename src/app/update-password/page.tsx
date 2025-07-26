
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UpdatePasswordPage() {

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Page No Longer In Use</CardTitle>
          <CardDescription>
            Password resets are now handled with a One-Time Password (OTP) system. Please go to the login page and click "Forgot Password" to start the new process.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild>
                <Link href="/login">Back to Login</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
