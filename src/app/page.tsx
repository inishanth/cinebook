
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { Movie, Genre, Language, Platform, Actor } from '@/types';
import { getMoviesByCategory, discoverMovies, getGenres, getLanguages, getPlatforms, getPopularActors } from '@/lib/movie-service';
import { MovieCategoryRow } from '@/components/movie/movie-category-row';
import { MovieDetailModal } from '@/components/movie/movie-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MovieCard } from '@/components/movie/movie-card';
import { ArrowLeft, Check, ChevronsUpDown, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';


const movieCategories = [
    { id: 'popular', title: 'Popular' },
    { id: 'top_rated', title: 'Top Rated' },
    { id: 'upcoming', title: 'Upcoming' },
    { id: 'now_playing', title: 'Now Playing' },
];

const recencyOptions = [
    { value: 'all', label: 'All Time' },
    { value: '6m', label: 'Last 6 months' },
    { value: '1y', label: 'Last 1 year' },
    { value: '5y', label: 'Last 5 years' },
    { value: '5y+', label: 'More than 5 years ago' },
];

function CategoryRowSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-7 w-48" />
            <div className="flex space-x-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="w-32 h-48 md:w-40 md:h-60" />
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

export default function Home() {
    const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
    const [moviesByCat, setMoviesByCat] = React.useState<Record<string, Movie[]>>({});
    
    const [allGenres, setAllGenres] = React.useState<Genre[]>([]);
    const [allLanguages, setAllLanguages] = React.useState<Language[]>([]);
    const [allPlatforms, setAllPlatforms] = React.useState<Platform[]>([]);
    const [allActors, setAllActors] = React.useState<Actor[]>([]);

    const [selectedGenre, setSelectedGenre] = React.useState('all');
    const [selectedLanguage, setSelectedLanguage] = React.useState('all');
    const [selectedPlatform, setSelectedPlatform] = React.useState('all');
    const [selectedActor, setSelectedActor] = React.useState('all');
    const [selectedRecency, setSelectedRecency] = React.useState('all');
    
    const [filteredMovies, setFilteredMovies] = React.useState<Movie[]>([]);
    const [isFilteredView, setIsFilteredView] = React.useState(false);
    
    const [loading, setLoading] = React.useState(true);
    const [loadingFilteredMovies, setLoadingFilteredMovies] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    
    const hasActiveFilters = selectedRecency !== 'all' || selectedGenre !== 'all' || selectedLanguage !== 'all' || selectedPlatform !== 'all' || selectedActor !== 'all';
    
    React.useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [
                    categoryMoviesData, 
                    genresData, 
                    languagesData, 
                    platformsData, 
                    actorsData
                ] = await Promise.all([
                    Promise.all(movieCategories.map(category => getMoviesByCategory(category.id))),
                    getGenres(),
                    getLanguages(),
                    getPlatforms(),
                    getPopularActors()
                ]);

                const moviesData: Record<string, Movie[]> = {};
                categoryMoviesData.forEach((movies, index) => {
                    moviesData[movieCategories[index].title] = movies;
                });

                setMoviesByCat(moviesData);
                setAllGenres(genresData);
                setAllLanguages(languagesData.map(l => ({ id: l.iso_639_1, name: l.english_name })));
                setAllPlatforms(platformsData.map(p => ({ id: p.provider_id, name: p.provider_name })));
                setAllActors(actorsData);
                setError(null);
            } catch (e) {
                if (e instanceof Error) {
                    setError(e.message);
                } else {
                    setError('An unknown error occurred.');
                }
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
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
                    recency: selectedRecency,
                    genreId: selectedGenre,
                    language: selectedLanguage,
                    platformId: selectedPlatform,
                    actorId: selectedActor,
                });
                setFilteredMovies(movies);
            } catch(e) {
                if (e instanceof Error) setError(e.message);
                else setError('An unknown error occurred.');
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

    }, [selectedRecency, selectedGenre, selectedLanguage, selectedPlatform, selectedActor, hasActiveFilters])

    const handleClearFilters = () => {
        setSelectedRecency('all');
        setSelectedGenre('all');
        setSelectedLanguage('all');
        setSelectedPlatform('all');
        setSelectedActor('all');
        setIsFilteredView(false);
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
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-2xl font-bold text-destructive mb-4">Oops! Something went wrong.</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <p className="text-sm text-muted-foreground">Please make sure you have added your TMDb API key to a <code className="bg-secondary p-1 rounded">.env.local</code> file.</p>
            </div>
        );
    }
    
    return (
        <>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-headline font-bold text-primary">Discover Movies</h2>
                     {hasActiveFilters && <Button variant="ghost" onClick={handleClearFilters}>Clear Filters</Button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger className="w-full" variant="secondary">
                            <SelectValue placeholder="All Genres" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Genres</SelectItem>
                            {allGenres.map(opt => (
                                <SelectItem key={opt.id} value={String(opt.id)}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedRecency} onValueChange={setSelectedRecency}>
                        <SelectTrigger className="w-full" variant="secondary">
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
                     <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="w-full" variant="secondary">
                            <SelectValue placeholder="All Languages" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">All Languages</SelectItem>
                            {allLanguages.map(opt => (
                                <SelectItem key={opt.id} value={String(opt.id)}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                        <SelectTrigger className="w-full" variant="secondary">
                            <SelectValue placeholder="All Platforms" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">All Platforms</SelectItem>
                            {allPlatforms.map(opt => (
                                <SelectItem key={opt.id} value={String(opt.id)}>
                                    {opt.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedActor} onValueChange={setSelectedActor}>
                        <SelectTrigger className="w-full" variant="secondary">
                            <SelectValue placeholder="Any Actor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any Actor</SelectItem>
                            {allActors.map(opt => (
                                <SelectItem key={opt.id} value={String(opt.id)}>
                                    {opt.name}
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
                    {loading ? (
                        <>
                            {movieCategories.map((cat) => <CategoryRowSkeleton key={cat.id} />)}
                        </>
                    ) : (
                        <>
                            {movieCategories.map((cat) => (
                                moviesByCat[cat.title] && moviesByCat[cat.title].length > 0 && (
                                    <motion.div key={cat.title} variants={itemVariants}>
                                        <MovieCategoryRow
                                            title={cat.title}
                                            movies={moviesByCat[cat.title]}
                                            onMovieClick={handleOpenModal}
                                        />
                                    </motion.div>
                                )
                            ))}
                        </>
                    )}
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
