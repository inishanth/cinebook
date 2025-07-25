
'use client';

import * as React from 'react';
import type { Movie } from '@/types';

interface WatchlistContextType {
  watchlist: Movie[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: number) => void;
  isMovieInWatchlist: (movieId: number) => boolean;
}

const WatchlistContext = React.createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = React.useState<Movie[]>([]);

  React.useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem('CineBook-watchlist');
      if (storedWatchlist) {
        setWatchlist(JSON.parse(storedWatchlist));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  React.useEffect(() => {
    try {
        localStorage.setItem('CineBook-watchlist', JSON.stringify(watchlist));
    } catch (error) {
        console.error("Failed to write watchlist to localStorage", error);
    }
  }, [watchlist]);
  
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
  
  const isMovieInWatchlist = (movieId: number) => {
    return watchlist.some(movie => movie.id === movieId);
  };

  return (
    <WatchlistContext.Provider
      value={{ watchlist, addToWatchlist, removeFromWatchlist, isMovieInWatchlist }}
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
