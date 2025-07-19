import Image from 'next/image';
import * as React from 'react';
import type { Movie, MovieDetails } from '@/types';
import { getMovieDetails, getBannerUrl } from '@/lib/movie-service';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWatchlist } from '@/context/watchlist-context';
import { ImdbLogo, MetacriticLogo, RottenTomatoesLogo } from '../icons/rating-logos';
import { NetflixLogo, HuluLogo, PrimeVideoLogo } from '../icons/platform-logos';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';

interface MovieDetailModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

// Note: Streaming platform availability is not available from TMDb API.
// This is kept for demonstration purposes.
const platformIcons = {
  netflix: <NetflixLogo className="h-6 w-auto" />,
  hulu: <HuluLogo className="h-6 w-auto" />,
  'prime-video': <PrimeVideoLogo className="h-6 w-auto" />,
};

function DetailSkeleton() {
    return (
      <div className="flex-grow overflow-y-auto p-6 -mt-32 md:-mt-40 z-10 relative text-white space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex items-center gap-4 flex-wrap">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
         <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-12 w-full sm:w-auto flex-1" />
            <Skeleton className="h-12 w-full sm:w-auto flex-1" />
        </div>
      </div>
    );
}

export function MovieDetailModal({ movie: initialMovie, isOpen, onClose }: MovieDetailModalProps) {
  const { addToWatchlist, isMovieInWatchlist } = useWatchlist();
  const [details, setDetails] = React.useState<MovieDetails | null>(null);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen && initialMovie) {
      setLoading(true);
      setDetails(null);
      getMovieDetails(initialMovie.id)
        .then(setDetails)
        .catch(err => {
            console.error(err);
            toast({
                variant: 'destructive',
                title: 'Error fetching details',
                description: 'Could not load movie details. Please try again later.'
            });
            onClose();
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, initialMovie, toast, onClose]);

  const movie = details || initialMovie;
  if (!movie) return null;

  const isInWatchlist = isMovieInWatchlist(movie.id);
  const trailer = details?.videos?.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[90vh] bg-background border-t-2 border-primary p-0 flex flex-col"
      >
        <div className="relative h-64 md:h-80 flex-shrink-0">
          <Image
            src={getBannerUrl(movie.backdrop_path)}
            alt={`Banner for ${movie.title}`}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        {loading ? <DetailSkeleton /> : (
            <div className="flex-grow overflow-y-auto p-6 -mt-32 md:-mt-40 z-10 relative text-white">
                <SheetHeader className="text-left space-y-4">
                    <SheetTitle className="text-3xl md:text-4xl font-headline ">{movie.title}</SheetTitle>
                    
                    <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <ImdbLogo className="h-6 w-auto" />
                        <Badge variant="secondary" className="text-lg">{movie.vote_average.toFixed(1)}</Badge>
                    </div>
                    {/* Note: Rotten Tomatoes and Metacritic are not in TMDb API */}
                    </div>

                    <SheetDescription className="text-muted-foreground text-base max-w-prose">{movie.overview}</SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 flex flex-col gap-6">
                    {/* 
                    This is kept for demonstration as TMDb does not provide streaming platform data easily.
                    A "watch provider" lookup would be needed.
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
                    */}

                    <div className="flex flex-col sm:flex-row gap-4">
                        {trailer && (
                            <Button asChild className="w-full sm:w-auto flex-1" variant="outline">
                                <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer">
                                Watch Trailer <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        <Button onClick={() => addToWatchlist(movie)} disabled={isInWatchlist} className="w-full sm:w-auto flex-1">
                            {isInWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}
                        </Button>
                    </div>
                </div>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
}