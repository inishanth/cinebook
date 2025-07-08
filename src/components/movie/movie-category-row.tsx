import type { Movie } from '@/types';
import { MovieCard } from './movie-card';

interface MovieCategoryRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
}

export function MovieCategoryRow({ title, movies, onMovieClick }: MovieCategoryRowProps) {
  return (
    <section>
      <h2 className="text-xl font-headline font-bold mb-4 text-primary">{title}</h2>
      <div className="flex overflow-x-auto space-x-4 -m-2 p-2 hide-scrollbar scroll-smooth snap-x snap-mandatory">
        {movies.map((movie) => (
          <div key={movie.id} className="snap-start flex-shrink-0">
             <MovieCard movie={movie} onClick={() => onMovieClick(movie)} />
          </div>
        ))}
      </div>
    </section>
  );
}
