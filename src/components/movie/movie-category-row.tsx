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
      <h2 className="text-2xl font-headline font-bold mb-4">{title}</h2>
      <div className="flex overflow-x-auto space-x-4 -m-2 p-2 hide-scrollbar">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onClick={() => onMovieClick(movie)} />
        ))}
      </div>
    </section>
  );
}
