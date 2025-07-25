
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your watchlist and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" type="text" placeholder="Enter username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter password" required />
          </div>
           <Button type="submit" className="w-full">
            Sign In
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 -translate-x-1/2 top-[-10px] bg-background px-2 text-xs text-muted-foreground">OR</span>
          </div>
           
           <Button variant="secondary" className="w-full border border-teal-500" asChild>
            <Link href="/">Continue as Guest</Link>
          </Button>

        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
            <div className="text-sm text-center">
              {"Don't have an account?"} <Link href="#" className="underline">Sign up</Link>
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
