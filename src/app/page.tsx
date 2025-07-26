
import { getMoviesByCategory, getGenres, getLanguages, getLeadActors } from '@/lib/movie-service';
import { MovieHomeClient, CategoryRowSkeleton } from '@/components/movie/movie-home-client';
import { movieCategories } from '@/lib/movie-categories';
import type { Movie, Genre, Person } from '@/types';
import * as React from 'react';
import { Suspense } from 'react';

async function InitialDataLoader() {
  const moviesByCat: Record<string, Movie[]> = {};

  // Dynamically create promises for each category
  const moviePromises = movieCategories.map(cat => getMoviesByCategory(cat.id, cat.id === 'popular' ? 0 : undefined));

  const [
    genres,
    languages,
    actors,
    ...movieResults
  ] = await Promise.all([
      getGenres(),
      getLanguages(),
      getLeadActors(),
      ...moviePromises,
  ]);
  
  // Assign movies to the map based on the category title
  movieCategories.forEach((cat, index) => {
    moviesByCat[cat.title] = movieResults[index];
  });

  return <MovieHomeClient 
    initialMoviesByCat={moviesByCat} 
    initialGenres={genres}
    initialLanguages={languages}
    initialActors={actors}
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

    