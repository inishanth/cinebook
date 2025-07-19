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
import { ExternalLink, Heart, Clock, Tags } from 'lucide-react';

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
      <div className="p-6 text-white space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
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
  const genres = details?.genres?.map(g => g.name).join(', ');
  
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[95vh] bg-background/80 backdrop-blur-sm border-t-2 border-primary p-0 flex flex-col rounded-t-2xl"
      >
        <div className="absolute top-0 left-0 w-full h-80">
          <Image
            src={getBannerUrl(movie.backdrop_path)}
            alt={`Banner for ${movie.title}`}
            fill
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="flex-grow overflow-y-auto z-10 relative">
            {loading ? <DetailSkeleton /> : (
                <div className="p-6 text-white space-y-4 md:space-y-6">
                    <SheetHeader className="text-left space-y-2">
                        <SheetTitle className="text-3xl md:text-4xl font-headline text-white">{movie.title}</SheetTitle>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {details?.runtime && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{details.runtime} min</span>
                                </div>
                            )}
                            {genres && (
                               <div className="flex items-center gap-1.5">
                                    <Tags className="w-4 h-4" />
                                    <span>{genres}</span>
                                </div>
                            )}
                        </div>
                    </SheetHeader>
                    
                    <div className="flex items-center gap-4 flex-wrap border-y border-white/10 py-4">
                        <div className="flex items-center gap-2">
                            <ImdbLogo className="h-6 w-auto" />
                            <Badge variant="secondary" className="text-lg bg-amber-400 text-black">{movie.vote_average.toFixed(1)}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <RottenTomatoesLogo className="h-6 w-auto" />
                            <Badge variant="secondary" className="text-lg bg-red-600 text-white">N/A</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <MetacriticLogo className="h-6 w-auto" />
                            <Badge variant="secondary" className="text-lg bg-yellow-400 text-black">N/A</Badge>
                        </div>
                    </div>

                    <SheetDescription className="text-white/90 text-base max-w-prose">{movie.overview}</SheetDescription>
                    
                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        {trailer && (
                            <Button asChild className="w-full sm:w-auto flex-1" variant="outline">
                                <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer">
                                Watch Trailer <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        <Button onClick={() => addToWatchlist(movie)} disabled={isInWatchlist} className="w-full sm:w-auto flex-1 bg-primary hover:bg-primary/90">
                           <Heart className="mr-2 h-4 w-4" />
                           {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
