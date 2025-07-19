
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { Movie, Genre } from '@/types';
import { getMoviesByCategory, getGenres, discoverMovies } from '@/lib/movie-service';
import { MovieCategoryRow } from '@/components/movie/movie-category-row';
import { MovieDetailModal } from '@/components/movie/movie-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MovieCard } from '@/components/movie/movie-card';
import { ArrowLeft, Check, ChevronsUpDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const movieCategories = [
    { id: 'popular', title: 'Popular' },
    { id: 'top_rated', title: 'Top Rated' },
    { id: 'upcoming', title: 'Upcoming' },
    { id: 'now_playing', title: 'Now Playing' },
    { id: 'action', title: 'Action' },
    { id: 'comedy', title: 'Comedy' }
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

function MultiSelectFilter<T extends { id: any, name: string }>({
    title,
    options,
    selected,
    onToggle,
}: {
    title: string,
    options: T[],
    selected: T[],
    onToggle: (item: T) => void
}) {
    const [open, setOpen] = React.useState(false);
    const selectedIds = new Set(selected.map(s => s.id));

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between w-full md:w-auto">
                    {title}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
                    <CommandList>
                        <CommandEmpty>No {title.toLowerCase()} found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={item.name}
                                    onSelect={() => {
                                      onToggle(item);
                                    }}
                                >
                                    <Check className={`mr-2 h-4 w-4 ${selectedIds.has(item.id) ? "opacity-100" : "opacity-0"}`} />
                                    {item.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export default function Home() {
    const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
    const [moviesByCat, setMoviesByCat] = React.useState<Record<string, Movie[]>>({});
    const [genres, setGenres] = React.useState<Genre[]>([]);
    
    const [selectedGenres, setSelectedGenres] = React.useState<Genre[]>([]);
    const [selectedRecency, setSelectedRecency] = React.useState('all');
    
    const [filteredMovies, setFilteredMovies] = React.useState<Movie[]>([]);
    const [isFilteredView, setIsFilteredView] = React.useState(false);
    
    const [loading, setLoading] = React.useState(true);
    const [loadingFilteredMovies, setLoadingFilteredMovies] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    
    const hasActiveFilters = selectedGenres.length > 0 || selectedRecency !== 'all';
    
    React.useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [genresData, ...categoryMoviesData] = await Promise.all([
                    getGenres(),
                    ...movieCategories.map(category => getMoviesByCategory(category.id)),
                ]);

                setGenres(genresData);

                const moviesData: Record<string, Movie[]> = {};
                categoryMoviesData.forEach((movies, index) => {
                    moviesData[movieCategories[index].title] = movies;
                });

                setMoviesByCat(moviesData);
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
                    genres: selectedGenres.map(g => g.id),
                    recency: selectedRecency
                });
                setFilteredMovies(movies);
            } catch(e) {
                if (e instanceof Error) setError(e.message);
                else setError('An unknown error occurred.');
            } finally {
                setLoadingFilteredMovies(false);
            }
        }
        
        // Debounce the filter application
        const handler = setTimeout(() => {
            applyFilters();
        }, 300);

        return () => {
            clearTimeout(handler);
        };

    }, [selectedGenres, selectedRecency, hasActiveFilters])

    const toggleSelection = <T extends {id: any}>(
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        item: T
    ) => {
        setter(prev => {
            if (prev.some(p => p.id === item.id)) {
                return prev.filter(p => p.id !== item.id);
            } else {
                return [...prev, item];
            }
        });
    };
    
    const handleGenreToggle = (genre: Genre) => toggleSelection(setSelectedGenres, genre);

    const handleClearFilters = () => {
        setSelectedGenres([]);
        setSelectedRecency('all');
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
    
    const removeGenre = (id: number) => setSelectedGenres(prev => prev.filter(g => g.id !== id));

    return (
        <>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-headline font-bold text-primary">Discover Movies</h2>
                     {hasActiveFilters && <Button variant="ghost" onClick={handleClearFilters}>Clear Filters</Button>}
                </div>
                <div className="flex flex-wrap gap-4 items-start">
                    <MultiSelectFilter title="Genres" options={genres} selected={selectedGenres} onToggle={handleGenreToggle} />
                    <Select value={selectedRecency} onValueChange={setSelectedRecency}>
                        <SelectTrigger className="w-full md:w-[200px]">
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
                 <div className="flex flex-wrap gap-2 mt-4">
                        {selectedGenres.map(g => (
                            <Badge key={g.id} variant="secondary">
                                {g.name}
                                <button onClick={() => removeGenre(g.id)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
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
