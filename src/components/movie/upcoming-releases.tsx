
'use client';

import * as React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getUpcomingMovies } from '@/lib/movie-service';
import type { Movie } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { Calendar } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { getLanguageName } from '@/lib/utils';

function UpcomingMovieItem({ movie }: { movie: Movie }) {
  const posterUrl = movie.poster_url
    ? `https://image.tmdb.org/t/p/w185${movie.poster_url}`
    : 'https://placehold.co/185x278.png';

  return (
    <div className="flex items-start space-x-4 py-4">
      <Image
        src={posterUrl}
        alt={movie.title}
        width={92}
        height={138}
        className="rounded-md"
      />
      <div className="flex-1">
        <h3 className="font-bold text-lg">{movie.title}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
          <Calendar className="w-4 h-4" />
          {movie.release_date ? format(new Date(movie.release_date), 'MMMM d, yyyy') : 'Date not available'}
        </p>
        <p className="text-sm mt-2 line-clamp-3">{movie.overview}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4 py-4">
                    <Skeleton className="w-[92px] h-[138px] rounded-md" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function UpcomingReleases() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [movies, setMovies] = React.useState<Movie[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const languageCode = 'ta';
  const region = 'IN';
  const languageName = getLanguageName(languageCode);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      getUpcomingMovies({ language: languageCode, region: region })
        .then(setMovies)
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : 'Could not fetch upcoming movies.';
          if (errorMessage.includes('TMDB API key is not configured')) {
            setError('The TMDB API Key is missing. Please add it to your .env file to see upcoming releases.');
          } else {
             toast({
              variant: 'destructive',
              title: 'Error',
              description: errorMessage,
            });
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, toast, languageCode, region]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-yellow-500 text-black hover:bg-yellow-600 border-yellow-600 rounded-full"
        >
          Upcoming
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px] bg-background/90 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-primary">
            Upcoming {languageName} Movies ({region})
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4 -mr-4">
          {loading ? (
             <LoadingSkeleton />
          ) : error ? (
            <p className="text-center text-destructive-foreground bg-destructive/80 p-4 rounded-md">
              {error}
            </p>
          ) : movies.length > 0 ? (
            <div className="divide-y divide-border">
              {movies.map((movie) => (
                <UpcomingMovieItem key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">
              No upcoming releases found matching the criteria.
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
