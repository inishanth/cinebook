
import { getMoviesByCategory } from '@/lib/movie-service';
import { MovieHomeClient } from '@/components/movie/movie-home-client';
import { CategoryRowSkeleton } from '@/components/movie/movie-home-client';
import type { Movie } from '@/types';
import * as React from 'react';
import { Suspense } from 'react';

const movieCategories = [
    { id: 'popular', title: 'Popular' },
    { id: 'top_rated', title: 'Top Rated' },
    { id: 'upcoming', title: 'Upcoming' },
    { id: 'recently_released', title: 'Recently Released' },
];

async function InitialCategoryLoader() {
  const moviesByCat: Record<string, Movie[]> = {};
  for (const category of movieCategories) {
    moviesByCat[category.title] = await getMoviesByCategory(category.id);
  }
  return <MovieHomeClient initialMoviesByCat={moviesByCat} />;
}


export default function Home() {
  return (
    <Suspense fallback={
        <div className="flex flex-col space-y-12">
            {movieCategories.map((cat) => <CategoryRowSkeleton key={cat.id} />)}
        </div>
    }>
      <InitialCategoryLoader />
    </Suspense>
  );
}
