
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updatePassword } from '@/lib/auth-service';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // This is a workaround to get the access token from the URL hash
  // because Next.js router doesn't expose it easily.
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1)); // remove #
        const token = params.get('access_token');
        if (token) {
          setAccessToken(token);
        } else {
            // This case can happen if the user navigates to the page directly
            // or if the link is malformed.
             const errorDescription = params.get('error_description');
             if(errorDescription) {
                 setError(errorDescription.replace(/\+/g, ' '));
             } else if (!params.has('access_token')) {
                setError('No password reset token found. Please return to the login page and try the "Forgot Password" link again.');
             }
        }
    }
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!accessToken) {
        setError("Missing access token. Please try the reset process again from the email link.");
        return;
    }

    setIsLoading(true);
    try {
      await updatePassword(newPassword, accessToken);
      toast({ title: 'Success!', description: 'Your password has been updated. You can now sign in.' });
      setIsSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isSuccess ? 'Password Updated!' : 'Update Your Password'}
          </CardTitle>
          <CardDescription>
            {isSuccess 
              ? 'You may now proceed to sign in.' 
              : 'Enter a new password for your account.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter your new password"
                  disabled={!accessToken}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                   disabled={!accessToken}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading || !accessToken}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          ) : (
            <Button asChild className="w-full">
              <Link href="/login">Back to Sign In</Link>
            </Button>
          )}
        </CardContent>
        {!isSuccess && (
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link href="/login" className="underline text-primary">
                  Sign In
                </Link>
              </p>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
