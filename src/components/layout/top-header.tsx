
'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
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
            <div className="container flex h-16 items-center">
                <a href="/" className="flex items-center gap-2 mr-auto">
                    <div className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center rounded-md font-bold text-lg">
                        CB
                    </div>
                    <h1 className="text-2xl font-headline text-primary hidden sm:block">CineBook</h1>
                </a>
                <div className="flex-1 flex justify-center px-4">
                    <InlineSearchBar />
                </div>
                <div className="flex items-center gap-2 ml-auto invisible">
                    {/* Placeholder to balance the header */}
                     <div className="h-8 w-8" />
                    <h1 className="text-2xl font-headline hidden sm:block">CineBook</h1>
                </div>
            </div>
        </header>
    );
}
