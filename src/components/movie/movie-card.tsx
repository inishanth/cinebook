
import Image from 'next/image';
import type { Movie } from '@/types';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

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
      className="flex-shrink-0 w-32 md:w-40 cursor-pointer relative"
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
      <Badge variant="secondary" className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 border-none">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span className="font-bold text-xs">{movie.vote_average.toFixed(1)}</span>
      </Badge>
    </motion.div>
  );
}
