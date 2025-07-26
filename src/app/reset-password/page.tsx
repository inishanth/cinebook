
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/lib/auth-service';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const emailFromQuery = searchParams.get('email');

  const [email, setEmail] = React.useState(emailFromQuery || '');
  const [otp, setOtp] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Supabase redirects with the token in the hash, not query params
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    // The access_token is the OTP for verification purposes
    if (accessToken) {
      setOtp(accessToken);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!otp) {
      setError('No reset token found. Please use the link from your email.');
      return;
    }
    if (!email) {
      setError('Email is missing. Please try the reset process again.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ email, otp, newPassword });
      toast({
        title: 'Success!',
        description: 'Your password has been updated. You can now sign in.',
      });
      setIsSuccess(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirectHome = () => {
    router.push('/');
  };

  if (isSuccess) {
    return (
      <Dialog open={true} onOpenChange={handleRedirectHome}>
        <DialogContent>
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl">Password Updated!</DialogTitle>
            <DialogDescription>
              You may now proceed to sign in with your new password.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleRedirectHome} className="w-full">
              Back to Home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={handleRedirectHome}>
      <DialogContent>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">Reset Your Password</DialogTitle>
          <DialogDescription>
            Enter your new password below. The reset token from your email has
            been automatically detected.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={!emailFromQuery ? '' : 'bg-secondary'}
              readOnly={!!emailFromQuery}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
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
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !otp}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
        </form>
        <DialogFooter className="!justify-center text-center">
          <p className="text-sm text-muted-foreground">
            If you didn't receive an email, please{' '}
            <Button asChild variant="link" className="p-0 h-auto">
              <Link href="/">return home to try again</Link>
            </Button>
            .
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
