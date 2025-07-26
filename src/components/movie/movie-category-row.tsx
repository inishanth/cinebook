
import type { Movie } from '@/types';
import { MovieCard } from './movie-card';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface MovieCategoryRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function MovieCategoryRow({ title, movies, onMovieClick, onRefresh, isLoading = false }: MovieCategoryRowProps) {
  return (
    <section>
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-headline font-bold text-primary">{title}</h2>
        {onRefresh && (
            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={isLoading} className="ml-2 h-7 w-7">
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
        )}
      </div>
      <div className="flex overflow-x-auto space-x-3 sm:space-x-4 -m-2 p-2 hide-scrollbar scroll-smooth snap-x snap-mandatory">
        {isLoading
            ? [...Array(10)].map((_, i) => (
                <div key={i} className="snap-start flex-shrink-0">
                    <div className="flex-shrink-0 w-28 sm:w-36 group">
                        <Skeleton className="w-full h-[168px] sm:h-[216px] rounded-lg" />
                        <div className="mt-2 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>
                </div>
              ))
            : movies.map((movie) => (
                <div key={movie.id} className="snap-start flex-shrink-0">
                    <MovieCard movie={movie} onClick={() => onMovieClick(movie)} />
                </div>
            ))
        }
      </div>
    </section>
  );
}
