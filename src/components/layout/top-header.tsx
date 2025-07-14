'use client';

import * as React from 'react';
import { Search, User } from 'lucide-react';
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
import { movies } from '@/data/movies';
import type { Movie } from '@/types';
import Image from 'next/image';
import { MovieDetailModal } from '../movie/movie-detail-modal';

function SearchDialog() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const filteredMovies = movies.filter((movie) =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filteredMovies);
    } else {
      setResults([]);
    }
  }, [searchQuery]);
  
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
        <div className="max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="space-y-4">
              {results.map((movie) => (
                <li
                  key={movie.id}
                  className="flex items-center space-x-4 cursor-pointer hover:bg-accent p-2 rounded-md"
                  onClick={() => handleMovieClick(movie)}
                >
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    width={40}
                    height={60}
                    className="rounded-md"
                    data-ai-hint={movie['data-ai-hint']}
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
                <h1 className="text-2xl font-headline text-primary">ReelDeal</h1>
                <Button variant="ghost" size="icon">
                    <User className="h-6 w-6" />
                    <span className="sr-only">Profile</span>
                </Button>
            </div>
        </header>
    );
}