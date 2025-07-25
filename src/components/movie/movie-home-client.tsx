
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { Movie, Genre, Person } from '@/types';
import { discoverMovies, getMoviesByCategory } from '@/lib/movie-service';
import { MovieCategoryRow } from '@/components/movie/movie-category-row';
import { MovieDetailModal } from '@/components/movie/movie-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MovieCard } from '@/components/movie/movie-card';
import { ArrowLeft, Film, Users, Languages, CalendarClock, FilterX } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


const movieCategories = [
    { id: 'popular', title: 'Popular' },
    { id: 'top_rated', title: 'Top Rated' },
    { id: 'upcoming', title: 'Upcoming' },
    { id: 'recently_released', title: 'Recently Released' },
];

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
            <div className="flex space-x-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="w-40 h-60" />
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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

export function MovieHomeClient({ 
    initialMoviesByCat,
    initialGenres,
    initialLanguages,
    initialActors,
}: { 
    initialMoviesByCat: Record<string, Movie[]>,
    initialGenres: Genre[],
    initialLanguages: string[],
    initialActors: Person[],
}) {
    const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
    const [moviesByCat, setMoviesByCat] = React.useState<Record<string, Movie[]>>(initialMoviesByCat);
    
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
    
    return (
        <>
            <div className="mb-12 bg-secondary/30 border border-border rounded-xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-headline font-bold text-primary">Discover Movies</h2>
                     {hasActiveFilters && (
                        <Button variant="ghost" onClick={handleClearFilters}>
                            <FilterX className="mr-2 h-4 w-4" />
                            Clear Filters
                        </Button>
                     )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="w-full" variant="secondary" icon={<Film />}>
                            <SelectValue placeholder="Genre" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Genres</SelectItem>
                            {initialGenres.map(genre => (
                                <SelectItem key={genre.id} value={String(genre.id)}>
                                    {genre.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={selectedActor} onValueChange={setSelectedActor}>
                        <SelectTrigger className="w-full" variant="secondary" icon={<Users />}>
                            <SelectValue placeholder="Actor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actors</SelectItem>
                            {initialActors.map(actor => (
                                <SelectItem key={actor.id} value={String(actor.id)}>
                                    {actor.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="w-full" variant="secondary" icon={<Languages />}>
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Languages</SelectItem>
                            {initialLanguages.map(lang => (
                                <SelectItem key={lang} value={lang}>
                                    {lang.toUpperCase()}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedRecency} onValueChange={setSelectedRecency}>
                        <SelectTrigger className="w-full" variant="secondary" icon={<CalendarClock />}>
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
            </div>

            {isFilteredView ? (
                loadingFilteredMovies ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {[...Array(12)].map((_, i) => <Skeleton key={i} className="w-full h-60" />)}
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
                    className="flex flex-col space-y-12"
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

  