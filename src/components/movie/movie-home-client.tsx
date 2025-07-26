

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { Movie, Genre, Person } from '@/types';
import { discoverMovies, getMoviesByCategory, getGenres, getLanguages, getLeadActors } from '@/lib/movie-service';
import { MovieCategoryRow } from '@/components/movie/movie-category-row';
import { MovieDetailModal } from '@/components/movie/movie-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MovieCard } from '@/components/movie/movie-card';
import { ArrowLeft, Film, Users, Languages, CalendarClock, FilterX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getLanguageName } from '@/lib/utils';
import { movieCategories } from '@/lib/movie-categories';


const recencyOptions = [
    { value: 'all', label: 'All Time' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last 1 year' },
    { value: '5y', label: 'Last 5 years' },
    { value: '5y+', label: 'More than 5 years ago' },
];

export function CategoryRowSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-7 w-48" />
            <div className="flex space-x-3 sm:space-x-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-28 sm:w-36 group">
                         <Skeleton className="w-full h-[168px] sm:h-[216px] rounded-lg" />
                         <div className="mt-2 space-y-2">
                             <Skeleton className="h-4 w-3/4" />
                         </div>
                     </div>
                ))}
            </div>
        </div>
    );
}

function MoviesByFilter({ movies, onBack, onMovieClick }: { movies: Movie[], onBack: () => void, onMovieClick: (movie: Movie) => void }) {
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center mb-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                    <ArrowLeft />
                </Button>
                <h2 className="text-2xl font-headline font-bold text-primary">
                    Filtered Results
                </h2>
            </div>
            {movies.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                    {movies.map(movie => (
                        <MovieCard key={movie.id} movie={movie} onClick={() => onMovieClick(movie)} />
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground">No movies found matching your criteria.</p>
            )}
        </motion.div>
    )
}

function FilterControls({
    genres, actors, languages,
    selectedGenre, setSelectedGenre,
    selectedActor, setSelectedActor,
    selectedLanguage, setSelectedLanguage,
    selectedRecency, setSelectedRecency
}: {
    genres: Genre[], actors: Person[], languages: string[],
    selectedGenre: string, setSelectedGenre: (v: string) => void,
    selectedActor: string, setSelectedActor: (v: string) => void,
    selectedLanguage: string, setSelectedLanguage: (v: string) => void,
    selectedRecency: string, setSelectedRecency: (v: string) => void,
}) {
    return (
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 items-start">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-full" icon={<Film />}>
                    <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map(genre => (
                        <SelectItem key={genre.id} value={String(genre.id)}>
                            {genre.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
                <Select value={selectedActor} onValueChange={setSelectedActor}>
                <SelectTrigger className="w-full" icon={<Users />}>
                    <SelectValue placeholder="Actor" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Actors</SelectItem>
                    {actors.map(actor => (
                        <SelectItem key={actor.id} value={String(actor.id)}>
                            {actor.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-full" icon={<Languages />}>
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map(lang => (
                        <SelectItem key={lang} value={lang}>
                            {getLanguageName(lang)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedRecency} onValueChange={setSelectedRecency}>
                <SelectTrigger className="w-full" icon={<CalendarClock />}>
                    <SelectValue placeholder="Recency" />
                </SelectTrigger>
                <SelectContent>
                    {recencyOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

export function MovieHomeClient({ 
    initialMoviesByCat,
}: { 
    initialMoviesByCat: Record<string, Movie[]>,
}) {
    const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
    const [moviesByCat, setMoviesByCat] = React.useState<Record<string, Movie[]>>(initialMoviesByCat);
    
    const [genres, setGenres] = React.useState<Genre[]>([]);
    const [languages, setLanguages] = React.useState<string[]>([]);
    const [actors, setActors] = React.useState<Person[]>([]);

    const [selectedGenre, setSelectedGenre] = React.useState('all');
    const [selectedLanguage, setSelectedLanguage] = React.useState('all');
    const [selectedRecency, setSelectedRecency] = React.useState('all');
    const [selectedActor, setSelectedActor] = React.useState('all');
    
    const [filteredMovies, setFilteredMovies] = React.useState<Movie[]>([]);
    const [isFilteredView, setIsFilteredView] = React.useState(false);
    
    const [loadingFilteredMovies, setLoadingFilteredMovies] = React.useState(false);
    const [reloadingCategory, setReloadingCategory] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const { toast } = useToast();

    const [popularMoviesPage, setPopularMoviesPage] = React.useState(0);
    const [reloadingCategoryPage, setReloadingCategoryPage] = React.useState(false);
    
    const hasActiveFilters = selectedGenre !== 'all' || selectedLanguage !== 'all' || selectedRecency !== 'all' || selectedActor !== 'all';

     React.useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [fetchedGenres, fetchedLangs, fetchedActors] = await Promise.all([
                    getGenres(),
                    getLanguages(),
                    getLeadActors(),
                ]);
                setGenres(fetchedGenres);
                setLanguages(fetchedLangs);
                setActors(fetchedActors);
            } catch (e) {
                 const errorMessage = e instanceof Error ? e.message : String(e);
                setError(errorMessage);
            }
        };
        fetchFilters();
    }, []);
    
    React.useEffect(() => {
        const applyFilters = async () => {
            if (!hasActiveFilters) {
                setIsFilteredView(false);
                return;
            }

            setLoadingFilteredMovies(true);
            setIsFilteredView(true);
            try {
                const movies = await discoverMovies({
                    genreId: selectedGenre,
                    language: selectedLanguage,
                    recency: selectedRecency,
                    personId: selectedActor,
                });
                setFilteredMovies(movies);
            } catch(e) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                setError(errorMessage);
            } finally {
                setLoadingFilteredMovies(false);
            }
        }
        
        const handler = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => {
            clearTimeout(handler);
        };

    }, [selectedGenre, selectedLanguage, selectedRecency, selectedActor, hasActiveFilters])

    const handleClearFilters = () => {
        setSelectedGenre('all');
        setSelectedLanguage('all');
        setSelectedRecency('all');
        setSelectedActor('all');
        setIsFilteredView(false);
    }
    
    const handleRefreshCategory = async (categoryId: string, categoryTitle: string) => {
        if (categoryId === 'popular') {
            setReloadingCategoryPage(true);
            const nextPage = popularMoviesPage + 1;
            try {
                const freshMovies = await getMoviesByCategory(categoryId, nextPage);
                if (freshMovies.length > 0) {
                    setMoviesByCat(prev => ({ ...prev, [categoryTitle]: freshMovies }));
                    setPopularMoviesPage(nextPage);
                    toast({
                        title: "Refreshed!",
                        description: `Showing the next page of popular movies.`,
                    });
                } else {
                    toast({
                        title: "No More Movies",
                        description: "You've reached the end of the list!",
                    });
                }
            } catch (e) {
                toast({
                    variant: 'destructive',
                    title: "Refresh Failed",
                    description: `Could not refresh the "${categoryTitle}" list.`,
                })
            } finally {
                setReloadingCategoryPage(false);
            }
        } else {
            setReloadingCategory(categoryTitle);
            try {
                const freshMovies = await getMoviesByCategory(categoryId);
                setMoviesByCat(prev => ({ ...prev, [categoryTitle]: freshMovies }));
                 toast({
                    title: "Refreshed!",
                    description: `The "${categoryTitle}" list has been updated.`,
                });
            } catch (e) {
                toast({
                    variant: 'destructive',
                    title: "Refresh Failed",
                    description: `Could not refresh the "${categoryTitle}" list.`,
                })
            } finally {
                setReloadingCategory(null);
            }
        }
    }

    const handleOpenModal = (movie: Movie) => setSelectedMovie(movie);
    const handleCloseModal = () => setSelectedMovie(null);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };
    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
    };

    if (error) {
        const isDbError = error.includes('SUPABASE_URL') || error.includes('SUPABASE_ANON_KEY') || error.includes('database');
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <h2 className="text-2xl font-bold text-destructive mb-4">
                    {isDbError ? 'Database Connection Error' : 'Oops! Something went wrong.'}
                </h2>
                <p className="text-muted-foreground mb-4 max-w-md">
                    {isDbError 
                        ? "The application couldn't connect to the database. Please ensure your Supabase credentials are configured correctly."
                        : `An unexpected error occurred: ${error}`
                    }
                </p>
                {isDbError && (
                    <div className="bg-secondary p-4 rounded-lg text-left max-w-md w-full">
                        <h3 className="font-bold mb-2">How to fix this:</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li>Create a new file named <code className="bg-background p-1 rounded">.env.local</code> in the root of your project.</li>
                            <li>Inside this file, add the following lines, replacing the placeholders with your actual Supabase Project URL and Anon Key:</li>
                            <pre className="bg-background p-2 rounded-md mt-2 overflow-x-auto">
                                <code className="text-sm">
                                    SUPABASE_URL="your_supabase_url_here"<br />
                                    SUPABASE_ANON_KEY="your_supabase_anon_key_here"
                                </code>
                            </pre>
                             <li>After saving the file, please restart the application preview.</li>
                        </ol>
                    </div>
                )}
            </div>
        );
    }
    
    const filterProps = { genres, actors, languages, selectedGenre, setSelectedGenre, selectedActor, setSelectedActor, selectedLanguage, setSelectedLanguage, selectedRecency, setSelectedRecency };

    return (
        <>
            <div className="mb-6 sm:mb-8">
                 {hasActiveFilters && (
                    <div className="flex justify-end mb-4 -mt-2 -mr-2">
                        <Button variant="ghost" onClick={handleClearFilters}>
                            <FilterX className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                    </div>
                 )}
                <div className="bg-neutral-800/50 sm:border sm:border-border rounded-lg p-2 sm:p-4">
                    <FilterControls {...filterProps} />
                </div>
            </div>

            {isFilteredView ? (
                loadingFilteredMovies ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                        {[...Array(12)].map((_, i) => (
                           <div key={i} className="flex-shrink-0 w-28 sm:w-36 group">
                                <Skeleton className="w-full h-[168px] sm:h-[216px] rounded-lg" />
                                <div className="mt-2 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <MoviesByFilter
                        movies={filteredMovies}
                        onBack={() => {
                            setIsFilteredView(false);
                            handleClearFilters();
                        }}
                        onMovieClick={handleOpenModal}
                    />
                )
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col space-y-6 sm:space-y-10"
                >
                    <>
                        {movieCategories.map((cat) => (
                            moviesByCat[cat.title] && moviesByCat[cat.title].length > 0 ? (
                                <motion.div key={cat.title} variants={itemVariants}>
                                    <MovieCategoryRow
                                        title={cat.title}
                                        movies={moviesByCat[cat.title]}
                                        onMovieClick={handleOpenModal}
                                        onRefresh={cat.id === 'popular' ? () => handleRefreshCategory(cat.id, cat.title) : undefined}
                                        isLoading={reloadingCategory === cat.title || (cat.id === 'popular' && reloadingCategoryPage)}
                                    />
                                </motion.div>
                            ) : null
                        ))}
                    </>
                </motion.div>
            )}

            <MovieDetailModal
                movie={selectedMovie}
                isOpen={!!selectedMovie}
                onClose={handleCloseModal}
            />
        </>
    );
}
