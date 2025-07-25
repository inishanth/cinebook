
import { getMoviesByCategory, getGenres, getLanguages, getLeadActors } from '@/lib/movie-service';
import { MovieHomeClient } from '@/components/movie/movie-home-client';
import { CategoryRowSkeleton } from '@/components/movie/movie-home-client';
import type { Movie, Genre, Person } from '@/types';
import * as React from 'react';
import { Suspense } from 'react';

const movieCategories = [
    { id: 'recently_released', title: 'Recently Released' },
    { id: 'popular', title: 'Popular' },
    { id: 'top_rated', title: 'Top Rated' },
];

async function InitialDataLoader() {
  const moviesByCat: Record<string, Movie[]> = {};

  const [
    recentlyReleased,
    popular,
    topRated,
    genres,
    languages,
    actors
  ] = await Promise.all([
      getMoviesByCategory('recently_released'),
      getMoviesByCategory('popular', 0),
      getMoviesByCategory('top_rated'),
      getGenres(),
      getLanguages(),
      getLeadActors()
  ]);

  moviesByCat['Recently Released'] = recentlyReleased;
  moviesByCat['Popular'] = popular;
  moviesByCat['Top Rated'] = topRated;

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
