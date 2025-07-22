
import Image from 'next/image';
import type { Movie } from '@/types';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Star, Clapperboard, User } from 'lucide-react';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const posterUrl = movie.poster_url
    ? `https://image.tmdb.org/t/p/w500${movie.poster_url}`
    : 'https://placehold.co/500x750.png';
  
  const castToDisplay = movie.cast?.slice(0, 3).map(c => c.name).join(', ');

  return (
    <motion.div
      onClick={onClick}
      className="flex-shrink-0 w-40 cursor-pointer group"
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="rounded-lg overflow-hidden shadow-lg bg-secondary relative">
        <Image
          src={posterUrl}
          alt={`Poster for ${movie.title}`}
          width={500}
          height={750}
          className="w-full h-auto transition-opacity duration-300 group-hover:opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 flex flex-col justify-end">
            <h3 className="font-bold text-sm text-white mb-1">{movie.title}</h3>
            
            <div className="flex items-center gap-1 text-xs text-amber-400 mb-2">
                <Star className="w-3 h-3 fill-current" />
                <span>{movie.vote_average.toFixed(1)}</span>
            </div>

            {movie.director && (
                 <div className="flex items-start gap-1.5 text-xs text-white/80 mb-1">
                    <Clapperboard className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="truncate">
                        {movie.director.name}
                    </span>
                </div>
            )}
             {castToDisplay && (
                 <div className="flex items-start gap-1.5 text-xs text-white/80">
                    <User className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                        {castToDisplay}
                    </span>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
}
