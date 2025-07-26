
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>
            Account creation is now handled in a pop-up from the main page. Please return home to sign up.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild>
                <Link href="/">Back to Home</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
