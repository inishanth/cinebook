
'use client';

import * as React from 'react';
import { Search, X, User, LogOut, Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScroll } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { searchMovies } from '@/lib/movie-service';
import type { Movie } from '@/types';
import Image from 'next/image';
import { MovieDetailModal } from '../movie/movie-detail-modal';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { initializeFirebase, requestNotificationPermission } from '@/lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { loginUser, createUser, sendPasswordResetOtp } from '@/lib/auth-service';

function SearchResults({ results, loading, onMovieClick }: { results: Movie[], loading: boolean, onMovieClick: (movie: Movie) => void }) {
    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-2">
                        <Skeleton className="w-10 h-16 rounded-md" />
                        <Skeleton className="h-6 flex-1" />
                    </div>
                ))}
            </div>
        )
    }

    if (results.length === 0) {
        return <p className="text-muted-foreground text-center p-4">No results found.</p>;
    }

    return (
        <ul className="space-y-4">
            {results.map((movie) => (
                <li
                    key={movie.id}
                    className="flex items-center space-x-4 cursor-pointer hover:bg-accent p-2 rounded-md"
                    onClick={() => onMovieClick(movie)}
                >
                    <Image
                        src={movie.poster_url ? `https://image.tmdb.org/t/p/w92${movie.poster_url}` : 'https://placehold.co/92x138.png'}
                        alt={movie.title}
                        width={40}
                        height={60}
                        className="rounded-md"
                    />
                    <span className="font-medium">{movie.title}</span>
                </li>
            ))}
        </ul>
    );
}

function InlineSearchBar() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<Movie[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
  const [showResults, setShowResults] = React.useState(false);
  const { toast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (searchQuery.trim().length > 2) {
      setLoading(true);
      setShowResults(true);
      const timer = setTimeout(async () => {
        try {
          const movies = await searchMovies(searchQuery);
          setResults(movies);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Search Failed",
            description: "Could not fetch movie results. Please try again later.",
          });
        } finally {
            setLoading(false);
        }
      }, 500); // Debounce API calls
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [searchQuery, toast]);
  
  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
  };
  
  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setShowResults(false);
  }

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);


  return (
    <div className="relative w-full max-w-sm" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
            id="search"
            aria-label="Search for a movie"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
                if (searchQuery.trim().length > 2) setShowResults(true);
            }}
            className="pl-9 pr-9 bg-neutral-800 border-border"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto bg-secondary border border-border rounded-md shadow-lg z-50">
           <SearchResults results={results} loading={loading} onMovieClick={handleMovieClick} />
        </div>
      )}

      <MovieDetailModal
          movie={selectedMovie}
          isOpen={!!selectedMovie}
          onClose={handleCloseModal}
      />
    </div>
  );
}

function AuthDialog({ onOpenChange, onAuthSuccess }: { onOpenChange: (open: boolean) => void, onAuthSuccess: () => void }) {
  const [view, setView] = React.useState('login'); // 'login', 'signup', 'reset'
  
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await loginUser({ email, password });
      login(user);
      toast({ title: 'Signed In!', description: 'Welcome back!' });
      onAuthSuccess();
      router.push('/'); 
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Sign In Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (username.length < 3) {
      toast({ variant: 'destructive', title: 'Error', description: 'Username must be at least 3 characters.' });
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
        toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters.' });
        setIsLoading(false);
        return;
    }

    try {
      await createUser({ email, username, password });
      toast({ title: 'Account Created!', description: 'You can now sign in with your new account.' });
      setView('login'); // Switch to login view on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Sign Up Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetOtp(email);
      // The backend won't throw an error for non-existent emails to prevent enumeration attacks.
      // So we always show a success-like message.
      toast({
        title: 'Check your email',
        description: `If an account with that email exists, a password reset link has been sent. The link will redirect you to a page to set a new password.`,
      });
      // Also pass the email to the reset page for pre-filling the form.
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      onAuthSuccess(); // Close the dialog
    } catch (error) {
      // This catch block is for unexpected server errors.
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Request Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <DialogContent className="sm:max-w-[425px]">
       {view === 'login' && (
         <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl">Welcome Back</DialogTitle>
              <DialogDescription>Sign in to access your watchlist and preferences.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-dialog">Email</Label>
                <Input id="email-dialog" type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-dialog">Password</Label>
                <Input id="password-dialog" type="password" placeholder="Enter password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                <div className="flex justify-end">
                    <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setView('reset')}>
                        Forgot Password?
                    </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>
             <DialogFooter className="pt-4 !justify-center">
                <div className="text-sm text-center">
                  {"Don't have an account?"}{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setView('signup')}>
                    Sign up
                  </Button>
                </div>
            </DialogFooter>
         </>
       )}
       {view === 'signup' && (
         <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl">Create an Account</DialogTitle>
              <DialogDescription>Enter your details to get started.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSignUp} className="space-y-4">
               <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username-signup">Username</Label>
                  <Input id="username-signup" type="text" placeholder="Choose a username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" placeholder="Create a password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                </Button>
            </form>
            <DialogFooter className="pt-4 !justify-center">
                <div className="text-sm text-center">
                  {'Already have an account?'}{' '}
                  <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
                    Sign In
                  </Button>
                </div>
            </DialogFooter>
         </>
       )}
        {view === 'reset' && (
         <>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl">Reset Password</DialogTitle>
              <DialogDescription>Enter your email to receive a password reset OTP.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email-dialog">Email</Label>
                <Input id="reset-email-dialog" type="email" placeholder="Enter your email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset OTP
              </Button>
            </form>
             <DialogFooter className="pt-4 !justify-center">
                <div className="text-sm text-center">
                  <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
                    Back to Sign In
                  </Button>
                </div>
            </DialogFooter>
         </>
       )}
    </DialogContent>
  )
}

function UserProfileButton() {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [notificationPermission, setNotificationPermission] = useState(typeof window !== 'undefined' ? Notification.permission : 'default');
    const [isAuthOpen, setIsAuthOpen] = React.useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
        initializeFirebase();
    }, []);
    
    const handleNotificationRequest = async () => {
        try {
            const permission = await requestNotificationPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                toast({ title: "Notifications Enabled!", description: "You'll now receive updates." });
            } else {
                toast({ variant: 'destructive', title: "Notifications Blocked", description: "You can enable notifications from your browser settings." });
            }
        } catch (error) {
            console.error('Error handling notification permission:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: "Error", description: errorMessage });
        }
    };

    if (!user) {
        return (
            <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                        <User className="h-5 w-5" />
                        <span className="sr-only">Login or Sign Up</span>
                    </Button>
                </DialogTrigger>
                <AuthDialog onOpenChange={setIsAuthOpen} onAuthSuccess={() => setIsAuthOpen(false)} />
            </Dialog>
        )
    }
    
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                    <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                            {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 mr-4">
                <div className="flex flex-col space-y-4">
                    <div className="space-y-1">
                        <p className="font-bold text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <Separator />
                     <div className="space-y-2">
                        <p className="font-semibold text-sm">Notifications</p>
                        {notificationPermission === 'default' && (
                            <Button variant="outline" className="w-full" onClick={handleNotificationRequest}>
                                <Bell className="mr-2 h-4 w-4" /> Enable Notifications
                            </Button>
                        )}
                        {notificationPermission === 'granted' && (
                             <div className="flex items-center justify-between text-sm text-muted-foreground p-2 bg-secondary rounded-md">
                                <span><Bell className="inline mr-2 h-4 w-4 text-green-500" />Enabled</span>
                             </div>
                        )}
                         {notificationPermission === 'denied' && (
                            <div className="flex items-center justify-between text-sm text-muted-foreground p-2 bg-destructive/20 text-destructive-foreground rounded-md">
                                <span><BellOff className="inline mr-2 h-4 w-4" />Denied</span>
                            </div>
                        )}
                    </div>
                    <Separator />
                    <Button variant="ghost" className="justify-start p-2 h-auto" onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function TopHeader() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/reset-password' || pathname === '/update-password';
    const { isLoading: isAuthLoading } = useAuth();

    useEffect(() => {
        return scrollY.on('change', (latest) => {
            setScrolled(latest > 20);
        });
    }, [scrollY]);


    return (
        <header className={cn(
            "sticky top-0 z-40 w-full bg-background transition-shadow",
            scrolled && "shadow-lg shadow-black/30"
            )}>
            <div className="container flex h-16 items-center">
                <a href="/" className={cn("flex items-center gap-2", isAuthPage ? 'mx-auto' : 'mr-auto')}>
                    <div className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center rounded-md font-bold text-lg">
                        CB
                    </div>
                    <h1 className="text-2xl font-headline text-primary hidden sm:block">CineBook</h1>
                </a>
                {!isAuthPage && (
                    <>
                        <div className="flex-1 flex justify-center px-4">
                            <InlineSearchBar />
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            {isAuthLoading ? <Skeleton className="h-10 w-10 rounded-full" /> : <UserProfileButton />}
                        </div>
                    </>
                )}
            </div>
        </header>
    );
}
