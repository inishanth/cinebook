
import Image from 'next/image';
import type { Movie } from '@/types';
import { motion } from 'framer-motion';
import { Star, Film, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  loading?: boolean;
}

export function MovieCard({ movie, onClick, loading = false }: MovieCardProps) {
  const posterUrl = movie.poster_url
    ? `https://image.tmdb.org/t/p/w500${movie.poster_url}`
    : 'https://placehold.co/500x750.png';

  if (loading) {
      return (
          <div className="flex-shrink-0 w-40 group">
              <Skeleton className="w-full h-60 rounded-lg" />
              <div className="mt-2 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
              </div>
          </div>
      )
  }

  return (
    <motion.div
      onClick={onClick}
      className="flex-shrink-0 w-40 cursor-pointer group"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative rounded-lg overflow-hidden shadow-lg bg-secondary">
        <Image
          src={posterUrl}
          alt={`Poster for ${movie.title}`}
          width={500}
          height={750}
          className="w-full h-auto"
        />
        <div className={cn(
          "absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-white",
           movie.vote_average > 0 ? "bg-black/60 backdrop-blur-sm" : "hidden"
        )}>
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{movie.vote_average.toFixed(1)}</span>
        </div>
      </div>
      <div className="mt-2 px-1">
        <h3 className="font-bold text-sm truncate text-primary group-hover:text-white" title={movie.title}>{movie.title}</h3>
      </div>
    </motion.div>
  );
}
