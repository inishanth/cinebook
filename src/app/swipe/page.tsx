

import { getTrendingMovies } from '@/lib/movie-service';
import { SwipeClientPage } from './swipe-client-page';

export const revalidate = 3600; // Revalidate every hour

export default async function SwipePage() {
  
  let movies = [];
  let error = null;

  try {
    movies = await getTrendingMovies();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error(e);
  }

  return <SwipeClientPage initialMovies={movies} error={error} />;
}
