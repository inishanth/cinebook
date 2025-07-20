
import { getTrendingMovies } from '@/lib/movie-service';
import { SwipeClientPage } from './swipe-client-page';

export const revalidate = 3600; // Revalidate every hour

export default async function SwipePage() {
  
  let movies = [];
  let error = null;

  try {
    movies = await getTrendingMovies();
  } catch (e) {
    if (e instanceof Error) {
        error = e.message;
    } else {
        error = 'An unknown error occurred while fetching movies.';
    }
    console.error(e);
  }

  return <SwipeClientPage initialMovies={movies} error={error} />;
}
