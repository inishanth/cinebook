'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col space-y-12"
    >
      {categories.map((category) => (
        <motion.div key={category} variants={itemVariants}>
          <MovieCategoryRow
            title={category}
            movies={categorizedMovies[category]}
            onMovieClick={handleOpenModal}
          />
        </motion.div>
      ))}

      <MovieDetailModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={handleCloseModal}
      />
    </motion.div>
  );
}
