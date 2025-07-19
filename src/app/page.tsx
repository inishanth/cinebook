'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { Movie } from '@/types';
import { getMoviesByCategory } from '@/lib/movie-service';
import { MovieCategoryRow } from '@/components/movie/movie-category-row';
import { MovieDetailModal } from '@/components/movie/movie-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';

const movieCategories = [
    { id: 'popular', title: 'Popular' },
    { id: 'top_rated', title: 'Top Rated' },
    { id: 'action', title: 'Action' },
    { id: 'comedy', title: 'Comedy' },
    { id: 'upcoming', title: 'Upcoming' },
    { id: 'now_playing', title: 'Now Playing' },
];

function CategoryRowSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-7 w-48" />
            <div className="flex space-x-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="w-32 h-48 md:w-40 md:h-60" />
                ))}
            </div>
        </div>
    );
}

export default function Home() {
  const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
  const [moviesByCat, setMoviesByCat] = React.useState<Record<string, Movie[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        const allMoviesData: Record<string, Movie[]> = {};
        // Use Promise.all to fetch categories concurrently
        const promises = movieCategories.map(category => 
            getMoviesByCategory(category.id).then(movies => ({
                title: category.title,
                movies
            }))
        );

        const results = await Promise.all(promises);
        
        for (const result of results) {
            allMoviesData[result.title] = result.movies;
        }

        setMoviesByCat(allMoviesData);
        setError(null);
      } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred.');
        }
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAllMovies();
  }, []);

  const handleOpenModal = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovie(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">Oops! Something went wrong.</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">Please make sure you have added your TMDb API key to a <code className="bg-secondary p-1 rounded">.env.local</code> file.</p>
        </div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col space-y-12"
      >
        {loading ? (
            movieCategories.map((cat) => <CategoryRowSkeleton key={cat.id} />)
        ) : (
            movieCategories.map((cat) => (
                moviesByCat[cat.title] && moviesByCat[cat.title].length > 0 && (
                    <motion.div key={cat.title} variants={itemVariants}>
                        <MovieCategoryRow
                            title={cat.title}
                            movies={moviesByCat[cat.title]}
                            onMovieClick={handleOpenModal}
                        />
                    </motion.div>
                )
            ))
        )}
      </motion.div>

      <MovieDetailModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={handleCloseModal}
      />
    </>
  );
}
