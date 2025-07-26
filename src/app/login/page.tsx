
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { loginUser, sendPasswordResetOtp } from '@/lib/auth-service';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';


function ResetPasswordDialog({ onEmailSent }: { onEmailSent: (email: string) => void }) {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetOtp(email);
      toast({ title: 'OTP Sent!', description: `A reset code has been sent to ${email}.` });
      onEmailSent(email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <DialogContent>
          <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we will send you a 4-digit code to reset your password.
              </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetRequest}>
              <div className="space-y-4 py-4">
                  <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@example.com"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                      />
                  </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="ghost">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Code
                  </Button>
              </DialogFooter>
          </form>
      </DialogContent>
  );
}


export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await loginUser({ email, password });
      login(user);
      toast({ title: 'Signed In!', description: 'Welcome back!' });
      router.push('/');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Sign In Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSent = (sentEmail: string) => {
    setIsResetPasswordOpen(false);
    router.push(`/reset-password?email=${encodeURIComponent(sentEmail)}`);
  };

  return (
    <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-sm mx-auto">
          <form onSubmit={handleSignIn}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your watchlist and preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <DialogTrigger asChild>
                     <Button variant="link" className="p-0 h-auto text-xs">
                        Forgot Password?
                    </Button>
                  </DialogTrigger>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full border border-primary" variant="default" disabled={isLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 top-[-10px] bg-background px-2 text-xs text-muted-foreground">OR</span>
              </div>
              
              <Button variant="outline" className="w-full border border-primary" asChild>
                <Link href="/">Continue as Guest</Link>
              </Button>

            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-2">
                <div className="text-sm text-center">
                  {"Don't have an account?"} <Link href="/signup" className="underline">Sign up</Link>
                </div>
            </CardFooter>
          </form>
        </Card>
      </div>
      <ResetPasswordDialog onEmailSent={handleEmailSent} />
    </Dialog>
  );
}
