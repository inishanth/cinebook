'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Undo } from 'lucide-react';
import { movies as allMovies } from '@/data/movies';
import type { Movie } from '@/types';
import { useWatchlist } from '@/context/watchlist-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { ImdbLogo, RottenTomatoesLogo } from '@/components/icons/rating-logos';

const SwipeCard = ({
  movie,
  onSwipe,
  active,
}: {
  movie: Movie;
  onSwipe: (direction: 'left' | 'right') => void;
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
      dragElastic={0.7}
      onDragEnd={(event, { offset }) => {
        if (offset.x > 100) {
          onSwipe('right');
        } else if (offset.x < -100) {
          onSwipe('left');
        }
      }}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute"
    >
      <Card className="w-[300px] h-[450px] md:w-[350px] md:h-[525px] overflow-hidden shadow-2xl bg-secondary relative">
        <Image
          src={`${movie.posterUrl}?${movie.id}`}
          alt={movie.title}
          fill
          className="object-cover"
          draggable="false"
          data-ai-hint={movie['data-ai-hint']}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
        <CardContent className="absolute bottom-0 left-0 p-4 text-white w-full">
          <h3 className="text-2xl font-headline font-bold">{movie.title}</h3>
          <p className="text-sm text-gray-300 line-clamp-2 mt-1">{movie.summary}</p>
          <div className="flex items-center justify-between mt-4 border-t border-white/20 pt-2">
            <div className="flex items-center gap-2">
              <ImdbLogo className="h-5 w-auto" />
              <span className="font-bold text-sm">{movie.ratings.imdb}</span>
            </div>
            <div className="flex items-center gap-2">
              <RottenTomatoesLogo className="h-5 w-auto" />
              <span className="font-bold text-sm">{movie.ratings.rottenTomatoes}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};


export default function SwipePage() {
  const { watchlist, rejected, addToWatchlist, rejectMovie } = useWatchlist();
  const [movieStack, setMovieStack] = React.useState<Movie[]>([]);
  const [lastAction, setLastAction] = React.useState<{type: 'like' | 'reject', movie: Movie} | null>(null);
  const [swipeDirection, setSwipeDirection] = React.useState<'left' | 'right' | null>(null);

  React.useEffect(() => {
    const watchlistIds = watchlist.map((m) => m.id);
    const filteredMovies = allMovies.filter(
      (m) => !watchlistIds.includes(m.id) && !rejected.includes(m.id)
    );
    setMovieStack(filteredMovies.reverse());
  }, [watchlist, rejected]);

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

    setMovieStack((prev) => prev.slice(0, prev.length - 1));
  };
  
  // This undo functionality is a bit basic and won't be persisted.
  // It's here for UX demonstration.
  const handleUndo = () => {
    if (!lastAction) return;

    if (lastAction.type === 'like') {
        // This is a simplification; ideally, we'd remove from watchlist
    } else {
        // This is a simplification; ideally, we'd remove from rejected
    }
    setMovieStack(prev => [...prev, lastAction.movie]);
    setLastAction(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <div className="relative w-[350px] h-[525px] flex items-center justify-center">
        <AnimatePresence custom={swipeDirection}>
          {movieStack.length > 0 ? (
            movieStack.map((movie, index) => (
              <SwipeCard
                key={movie.id}
                movie={movie}
                onSwipe={handleSwipe}
                active={index === movieStack.length - 1}
              />
            ))
          ) : (
            <Card className="w-[300px] h-[450px] md:w-[350px] md:h-[525px] flex flex-col items-center justify-center bg-secondary text-center p-4">
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
        >
          <Heart className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
