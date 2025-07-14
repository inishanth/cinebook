import Image from 'next/image';
import type { Movie } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90vh] bg-background border-t-2 border-primary p-0 flex flex-col"
      >
        <div className="relative h-64 md:h-80 flex-shrink-0">
          <Image
            src={movie.bannerUrl}
            alt={`Banner for ${movie.title}`}
            fill
            className="object-cover"
            data-ai-hint={movie['data-ai-hint']}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>
        <div className="flex-grow overflow-y-auto p-6 -mt-24 md:-mt-32 z-10 relative text-white">
          <SheetHeader className="text-left space-y-4">
            <SheetTitle className="text-3xl md:text-4xl font-headline ">{movie.title}</SheetTitle>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <ImdbLogo className="h-6 w-auto" />
                <Badge variant="secondary" className="text-lg">{movie.ratings.imdb}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <RottenTomatoesLogo className="h-6 w-auto" />
                <Badge variant="secondary" className="text-lg">{movie.ratings.rottenTomatoes}%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <MetacriticLogo className="h-6 w-auto" />
                <Badge variant="secondary" className="text-lg">{movie.ratings.metacritic}</Badge>
              </div>
            </div>

            <SheetDescription className="text-muted-foreground text-base max-w-prose">{movie.summary}</SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Available On</h3>
              <div className="flex space-x-4">
                {movie.platforms.map((platform) => (
                  <div key={platform} className="p-2 bg-secondary rounded-md">
                    {platformIcons[platform]}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild className="w-full sm:w-auto flex-1" variant="outline">
                <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">
                  Watch Trailer
                </a>
              </Button>
              <Button onClick={() => addToWatchlist(movie)} disabled={isInWatchlist} className="w-full sm:w-auto flex-1">
                {isInWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
