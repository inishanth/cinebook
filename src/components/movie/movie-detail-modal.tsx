import Image from 'next/image';
import type { Movie } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWatchlist } from '@/context/watchlist-context';
import { ImdbLogo, MetacriticLogo, RottenTomatoesLogo } from '../icons/rating-logos';
import { NetflixLogo, HuluLogo, PrimeVideoLogo } from '../icons/platform-logos';

interface MovieDetailModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

const platformIcons = {
  netflix: <NetflixLogo className="h-6 w-auto" />,
  hulu: <HuluLogo className="h-6 w-auto" />,
  'prime-video': <PrimeVideoLogo className="h-6 w-auto" />,
};

export function MovieDetailModal({ movie, isOpen, onClose }: MovieDetailModalProps) {
  const { addToWatchlist, isMovieInWatchlist } = useWatchlist();

  if (!movie) return null;

  const isInWatchlist = isMovieInWatchlist(movie.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-background border-border p-0">
        <div className="relative h-64 md:h-96">
          <Image
            src={`${movie.bannerUrl}?${movie.id}`}
            alt={`Banner for ${movie.title}`}
            fill
            className="object-cover rounded-t-lg"
            data-ai-hint={movie['data-ai-hint']}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="p-6 pt-0 -mt-20 z-10 relative">
          <DialogHeader>
            <DialogTitle className="text-3xl font-headline text-white">{movie.title}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            <div className="md:col-span-2">
              <DialogDescription className="text-muted-foreground">{movie.summary}</DialogDescription>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Available On</h3>
                <div className="flex space-x-4">
                  {movie.platforms.map((platform) => (
                    <div key={platform} className="p-2 bg-secondary rounded-md">
                      {platformIcons[platform]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                 <h3 className="text-lg font-semibold text-foreground">Ratings</h3>
                <div className="flex items-center gap-3">
                  <ImdbLogo className="h-6 w-auto" />
                  <Badge variant="secondary" className="text-lg">{movie.ratings.imdb}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <RottenTomatoesLogo className="h-6 w-auto" />
                  <Badge variant="secondary" className="text-lg">{movie.ratings.rottenTomatoes}%</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <MetacriticLogo className="h-6 w-auto" />
                  <Badge variant="secondary" className="text-lg">{movie.ratings.metacritic}</Badge>
                </div>
              </div>
               <Button asChild className="w-full" variant="outline">
                <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">
                  Watch Trailer
                </a>
              </Button>
              <Button onClick={() => addToWatchlist(movie)} disabled={isInWatchlist} className="w-full">
                {isInWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
