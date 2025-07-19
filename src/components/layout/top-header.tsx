'use client';

import * as React from 'react';
import { Search, User, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useScroll } from 'framer-motion';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { searchMovies, getPosterUrl } from '@/lib/movie-service';
import type { Movie } from '@/types';
import Image from 'next/image';
import { MovieDetailModal } from '../movie/movie-detail-modal';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

function SearchDialog() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<Movie[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (searchQuery.trim().length > 2) {
      setLoading(true);
      const timer = setTimeout(async () => {
        try {
          const movies = await searchMovies(searchQuery);
          setResults(movies);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Search Failed",
            description: "Could not fetch movie results. Please check your API key and try again.",
          });
        } finally {
            setLoading(false);
        }
      }, 500); // Debounce API calls
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [searchQuery, toast]);
  
  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
  };
  
  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSearchQuery('');
    setResults([]);
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => {
      if (!open) {
        handleCloseDialog();
      } else {
        setDialogOpen(true);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Search className="h-6 w-6" />
          <span className="sr-only">Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-secondary border-border">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Search Movies</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="search"
            placeholder="e.g. Inception"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-2">
            {loading ? (
                 [...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-2">
                        <Skeleton className="w-10 h-16 rounded-md" />
                        <Skeleton className="h-6 flex-1" />
                    </div>
                ))
            ) : results.length > 0 ? (
            <ul className="space-y-4">
              {results.map((movie) => (
                <li
                  key={movie.id}
                  className="flex items-center space-x-4 cursor-pointer hover:bg-accent p-2 rounded-md"
                  onClick={() => handleMovieClick(movie)}
                >
                  <Image
                    src={getPosterUrl(movie.poster_path, 'w500')}
                    alt={movie.title}
                    width={40}
                    height={60}
                    className="rounded-md"
                  />
                  <span className="font-medium">{movie.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            searchQuery.length > 2 && <p className="text-muted-foreground text-center">No results found.</p>
          )}
        </div>
        <MovieDetailModal
          movie={selectedMovie}
          isOpen={!!selectedMovie}
          onClose={handleCloseModal}
        />
      </DialogContent>
    </Dialog>
  );
}


export function TopHeader() {
    const { scrollY } = useScroll();
    const [scrolled, setScrolled] = useState(false);

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
            <div className="container flex h-16 items-center justify-between">
                <SearchDialog />
                <div className="flex items-center gap-2">
                    <Film className="h-8 w-8 text-primary" />
                    <h1 className="text-2xl font-headline text-primary">ReelDeal</h1>
                </div>
                <Button variant="ghost" size="icon">
                    <User className="h-6 w-6" />
                    <span className="sr-only">Profile</span>
                </Button>
            </div>
        </header>
    );
}