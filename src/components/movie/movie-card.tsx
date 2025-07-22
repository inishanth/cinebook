
import Image from 'next/image';
import type { Movie } from '@/types';
import { motion } from 'framer-motion';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const posterUrl = movie.poster_url
    ? `https://image.tmdb.org/t/p/w500${movie.poster_url}`
    : 'https://placehold.co/500x750.png';

  return (
    <motion.div
      onClick={onClick}
      className="flex-shrink-0 w-40 cursor-pointer group"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="rounded-lg overflow-hidden shadow-lg bg-secondary">
        <Image
          src={posterUrl}
          alt={`Poster for ${movie.title}`}
          width={500}
          height={750}
          className="w-full h-auto"
        />
      </div>
    </motion.div>
  );
}
