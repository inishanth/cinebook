import Image from 'next/image';
import type { Movie } from '@/types';
import { motion } from 'framer-motion';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <motion.div
      onClick={onClick}
      className="flex-shrink-0 w-40 md:w-48 cursor-pointer"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="rounded-lg overflow-hidden shadow-lg bg-secondary">
        <Image
          src={`${movie.posterUrl}?${movie.id}`}
          alt={`Poster for ${movie.title}`}
          width={500}
          height={750}
          className="w-full h-auto"
          data-ai-hint={movie['data-ai-hint']}
        />
      </div>
    </motion.div>
  );
}
