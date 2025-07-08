'use client';

import * as React from 'react';
import type { Movie } from '@/types';

interface WatchlistContextType {
  watchlist: Movie[];
  rejected: number[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  rejectMovie: (movieId: number) => void;
  isMovieInWatchlist: (movieId: number) => boolean;
}

const WatchlistContext = React.createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = React.useState<Movie[]>([]);
  const [rejected, setRejected] = React.useState<number[]>([]);

  React.useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem('reeldeal-watchlist');
      if (storedWatchlist) {
        setWatchlist(JSON.parse(storedWatchlist));
      }
      const storedRejected = localStorage.getItem('reeldeal-rejected');
      if (storedRejected) {
        setRejected(JSON.parse(storedRejected));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('reeldeal-watchlist', JSON.stringify(watchlist));
  }, [watchlist]);
  
  React.useEffect(() => {
    localStorage.setItem('reeldeal-rejected', JSON.stringify(rejected));
  }, [rejected]);

  const addToWatchlist = (movie: Movie) => {
    setWatchlist((prev) => {
      if (prev.find((m) => m.id === movie.id)) {
        return prev;
      }
      return [...prev, movie];
    });
  };

  const removeFromWatchlist = (movieId: number) => {
    setWatchlist((prev) => prev.filter((movie) => movie.id !== movieId));
  };

  const rejectMovie = (movieId: number) => {
    setRejected((prev) => {
      if (prev.includes(movieId)) {
        return prev;
      }
      return [...prev, movieId]
    });
  };
  
  const isMovieInWatchlist = (movieId: number) => {
    return watchlist.some(movie => movie.id === movieId);
  };

  return (
    <WatchlistContext.Provider
      value={{ watchlist, rejected, addToWatchlist, removeFromWatchlist, rejectMovie, isMovieInWatchlist }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = React.useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
