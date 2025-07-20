'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Undo, Film } from 'lucide-react';
import type { Movie } from '@/types';
import { useWatchlist } from '@/context/watchlist-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { ImdbLogo } from '@/components/icons/rating-logos';
import { MovieDetailModal, getPosterUrl } from '@/components/movie/movie-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';

const SwipeCard = ({
  movie,
  onSwipe,
  onCardTap,
  active,
}: {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right') => void;
  onCardTap: () => void;
  active: boolean;
}) => {
  const cardVariants = {
    initial: { scale: 0, y: -200, opacity: 0 },
    animate: { scale: 1, y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'right' ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.3, ease: 'easeIn' },
    }),
  };

  return (
    <motion.div
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.6}
      onDragEnd={(event, { offset }) => {
        const swipeThreshold = 80;
        const tapThreshold = 5;
        if (Math.abs(offset.x) < tapThreshold && Math.abs(offset.y) < tapThreshold) {
          onCardTap();
          return;
        }
        if (offset.x > swipeThreshold) {
          onSwipe('right');
        } else if (offset.x < -swipeThreshold) {
          onSwipe('left');
        }
      }}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute cursor-pointer"
    >
      <Card className="w-[300px] h-[450px] md:w-[350px] md:h-[525px] overflow-hidden shadow-2xl bg-secondary relative">
        <Image
          src={getPosterUrl(movie.poster_path)}
          alt={movie.title}
          fill
          className="object-cover"
          draggable="false"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        <CardContent className="absolute bottom-0 left-0 p-4 text-white w-full">
          <h3 className="text-2xl font-headline font-bold">{movie.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{movie.overview}</p>
          <div className="flex items-center justify-between mt-4 border-t border-white/20 pt-2">
            <div className="flex items-center gap-2">
              <ImdbLogo className="h-5 w-auto" />
              <span className="font-bold text-sm">{movie.vote_average.toFixed(1)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};


export function SwipeClientPage({ initialMovies, error: initialError }: { initialMovies: Movie[], error: string | null }) {
  const { watchlist, rejected, addToWatchlist, rejectMovie } = useWatchlist();
  const [movieStack, setMovieStack] = React.useState<Movie[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(initialError);
  const [lastAction, setLastAction] = React.useState<{type: 'like' | 'reject', movie: Movie} | null>(null);
  const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null);
  const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);

  React.useEffect(() => {
    if (initialMovies) {
        const watchlistIds = watchlist.map((m) => m.id);
        const filteredMovies = initialMovies.filter(
          (m) => !watchlistIds.includes(m.id) && !rejected.includes(m.id)
        );
        setMovieStack(filteredMovies.reverse());
    }
    setLoading(false);
  }, [initialMovies, watchlist, rejected]);

  const handleOpenModal = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (movieStack.length === 0) return;
    
    setSwipeDirection(direction);
    const movie = movieStack[movieStack.length - 1];

    if (direction === 'right') {
      addToWatchlist(movie);
      setLastAction({ type: 'like', movie });
    } else {
      rejectMovie(movie.id);
      setLastAction({ type: 'reject', movie });
    }

    setTimeout(() => {
        setMovieStack((prev) => prev.slice(0, prev.length - 1));
        setSwipeDirection(null);
    }, 300);
  };
  
  const handleUndo = () => {
    if (!lastAction) return;
    setMovieStack(prev => [...prev, lastAction.movie]);
    setLastAction(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <div className="relative w-[350px] h-[525px] flex items-center justify-center">
        <AnimatePresence custom={swipeDirection}>
          {loading ? (
             <Skeleton className="w-[300px] h-[450px] md:w-[350px] md:h-[525px] rounded-2xl" />
          ) : error ? (
            <Card className="w-[300px] h-[450px] md:w-[350px] md:h-[525px] flex flex-col items-center justify-center bg-secondary text-center p-4">
                <h3 className="text-xl font-headline text-destructive">Error Loading Movies</h3>
                <p className="text-muted-foreground mt-2">{error}</p>
                 <p className="text-sm text-muted-foreground">Please make sure you have added your Neon Database URL to a <code className="bg-secondary p-1 rounded">.env.local</code> file.</p>
            </Card>
          ) : movieStack.length > 0 ? (
            movieStack.map((movie, index) => (
              <SwipeCard
                key={movie.id}
                movie={movie}
                onSwipe={(dir) => handleSwipe(dir)}
                onCardTap={() => handleOpenModal(movie)}
                active={index === movieStack.length - 1}
              />
            ))
          ) : (
            <Card className="w-[300px] h-[450px] md:w-[350px] md:h-[525px] flex flex-col items-center justify-center bg-secondary text-center p-4">
              <Film className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-headline">All Caught Up!</h3>
              <p className="text-muted-foreground mt-2">You've swiped through all available movies. Check back later for more!</p>
            </Card>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center space-x-6">
        <Button
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-2 border-amber-500 text-amber-500 hover:bg-amber-500/10"
          onClick={() => handleSwipe('left')}
          disabled={loading || movieStack.length === 0}
        >
          <X className="w-8 h-8" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full border-2 text-muted-foreground hover:bg-muted-foreground/10"
          onClick={handleUndo}
          disabled={!lastAction}
        >
          <Undo className="w-6 h-6" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-2 border-primary text-primary hover:bg-primary/10"
          onClick={() => handleSwipe('right')}
          disabled={loading || movieStack.length === 0}
        >
          <Heart className="w-8 h-8" />
        </Button>
      </div>

      <MovieDetailModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={handleCloseModal}
      />
    </div>
  );
}
