
import { getMoviesByCategory, getUpcomingMovies } from '@/lib/movie-service';
import { MovieHomeClient, CategoryRowSkeleton } from '@/components/movie/movie-home-client';
import { movieCategories } from '@/lib/movie-categories';
import type { Movie } from '@/types';
import * as React from 'react';
import { Suspense } from 'react';

async function InitialDataLoader() {
  const moviesByCat: Record<string, Movie[]> = {};

  // Define which categories come from DB and which from TMDB
  const dbCategories = movieCategories.filter(cat => cat.id !== 'upcoming');
  const tmdbCategories = movieCategories.filter(cat => cat.id === 'upcoming');

  // Create promises for DB categories
  const dbMoviePromises = dbCategories.map(cat => getMoviesByCategory(cat.id, cat.id === 'popular' ? 0 : undefined));
  
  // Create promises for TMDB categories
  const tmdbMoviePromises = tmdbCategories.map(cat => getUpcomingMovies({ language: 'en', region: 'US'}));

  const [
    ...dbMovieResults
  ] = await Promise.all(dbMoviePromises);

  const [
    ...tmdbMovieResults
  ] = await Promise.all(tmdbMoviePromises);

  // Assign movies from DB to the map
  dbCategories.forEach((cat, index) => {
    moviesByCat[cat.title] = dbMovieResults[index];
  });

  // Assign movies from TMDB to the map
  tmdbCategories.forEach((cat, index) => {
    moviesByCat[cat.title] = tmdbMovieResults[index];
  });

  return <MovieHomeClient 
    initialMoviesByCat={moviesByCat} 
  />;
}


export default function Home() {
  return (
    <Suspense fallback={
        <div className="flex flex-col space-y-12">
            {movieCategories.map((cat) => <CategoryRowSkeleton key={cat.id} />)}
        </div>
    }>
      <InitialDataLoader />
    </Suspense>
  );
}
