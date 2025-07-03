'use client';

import * as React from 'react';
import { movies as allMovies } from '@/data/movies';
import type { Movie } from '@/types';
import { MovieCategoryRow } from '@/components/movie/movie-category-row';
import { MovieDetailModal } from '@/components/movie/movie-detail-modal';

export default function Home() {
  const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);

  const handleOpenModal = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const categorizedMovies = React.useMemo(() => {
    const categories: { [key: string]: Movie[] } = {};
    allMovies.forEach((movie) => {
      if (!categories[movie.category]) {
        categories[movie.category] = [];
      }
      categories[movie.category].push(movie);
    });
    return categories;
  }, []);

  const categories = Object.keys(categorizedMovies);

  return (
    <div className="flex flex-col space-y-12">
      <header className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Welcome to ReelDeal</h1>
        <p className="text-muted-foreground mt-2 text-lg">Discover your next binge-worthy show.</p>
      </header>
      
      {categories.map((category) => (
        <MovieCategoryRow
          key={category}
          title={category}
          movies={categorizedMovies[category]}
          onMovieClick={handleOpenModal}
        />
      ))}
      
      <MovieDetailModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={handleCloseModal}
      />
    </div>
  );
}
