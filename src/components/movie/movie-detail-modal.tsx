
import Image from 'next/image';
import * as React from 'react';
import type { Movie, MovieDetails } from '@/types';
import { getMovieDetails } from '@/lib/movie-service';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWatchlist } from '@/context/watchlist-context';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Heart, Clock, Tags, X, Star, Film, Users } from 'lucide-react';


const getPosterUrl = (path: string | null) => {
  if (!path) {
    return 'https://placehold.co/500x750.png';
  }
  return `https://image.tmdb.org/t/p/w500${path}`;
};


interface MovieDetailModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

function DetailSkeleton() {
    return (
      <div className="p-6 text-white space-y-6">
        <SheetHeader>
            <SheetTitle className="sr-only">Loading movie details</SheetTitle>
        </SheetHeader>
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

  const movieToDisplay = details || initialMovie;
  if (!movieToDisplay) return null;

  const isInWatchlist = isMovieInWatchlist(movieToDisplay.id);
  const trailer = details?.videos?.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
  const genres = details?.genres?.map(g => g.name).join(', ');
  
  const cast = details?.cast;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="h-[95vh] bg-background/80 backdrop-blur-sm border-t-2 border-primary p-0 flex flex-col rounded-t-2xl"
      >
         <SheetTitle className="sr-only">
            {movieToDisplay ? movieToDisplay.title : 'Movie Details'}
         </SheetTitle>
        <div className="absolute top-0 left-0 w-full h-80">
          <Image
            src={getPosterUrl(movieToDisplay.poster_url)}
            alt={`Poster for ${movieToDisplay.title}`}
            fill
            className="object-cover object-top opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
         <SheetClose className="absolute right-4 top-4 z-20 rounded-full p-1 bg-background/50 text-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </SheetClose>

        <div className="flex-grow overflow-y-auto z-10 relative">
            {loading ? <DetailSkeleton /> : (
                <div className="p-6 text-white space-y-4 md:space-y-6">
                    <SheetHeader className="text-left space-y-2">
                        <SheetTitle className="text-3xl md:text-4xl font-headline text-white">{movieToDisplay.title}</SheetTitle>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            {details?.runtime ? (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    <span>{details.runtime} min</span>
                                </div>
                            ) : initialMovie && <Skeleton className="h-4 w-16" />}
                            {genres ? (
                               <div className="flex items-center gap-1.5">
                                    <Tags className="w-4 h-4" />
                                    <span>{genres}</span>
                                </div>
                            ) : initialMovie && <Skeleton className="h-4 w-24" />}
                        </div>
                    </SheetHeader>
                    
                    <div className="flex items-center gap-6 flex-wrap border-y border-white/10 py-4">
                        <div className="flex items-center gap-2" title="TMDb Rating">
                           <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                           <span className="text-lg font-bold">{movieToDisplay.vote_average.toFixed(1)}</span>
                           <span className="text-sm text-muted-foreground">/ 10</span>
                        </div>
                    </div>

                    <div className="space-y-3 text-white/90">
                      {cast && cast.length > 0 && (
                         <div className="flex items-start gap-3">
                           <Users className="w-5 h-5 mt-1 shrink-0" />
                           <div>
                              <h4 className="font-semibold text-white">Starring</h4>
                              <p className="text-muted-foreground">{cast.join(', ')}</p>
                           </div>
                        </div>
                      )}
                    </div>
                    
                    <SheetDescription className="text-white/90 text-base max-w-prose pt-2">{movieToDisplay.overview}</SheetDescription>
                    
                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        {trailer && (
                            <Button asChild className="w-full sm:w-auto flex-1" variant="outline">
                                <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer">
                                Watch Trailer <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                        )}
                        <Button onClick={() => addToWatchlist(movieToDisplay as Movie)} disabled={isInWatchlist} className="w-full sm:w-auto flex-1 bg-primary hover:bg-primary/90">
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
