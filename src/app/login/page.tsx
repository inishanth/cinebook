
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
import { loginUser } from '@/lib/auth-service';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await loginUser({ username, password });
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

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm mx-auto">
        <form onSubmit={handleSignIn}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your watchlist and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full border border-primary" variant="outline" disabled={isLoading}>
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
  );
}
