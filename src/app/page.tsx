'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import type { Movie, Genre, Actor, Language, WatchProvider } from '@/types';
import { getMoviesByCategory, getGenres, discoverMovies, searchActors, getLanguages, getPlatforms } from '@/lib/movie-service';
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
    onSelect,
}: {
    title: string,
    options: T[],
    selected: T[],
    onSelect: (item: T) => void
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
                                    value={item.id.toString()}
                                    onSelect={(currentValue) => {
                                        const selectedItem = options.find(o => o.id.toString() === currentValue);
                                        if (selectedItem) {
                                            onSelect(selectedItem);
                                        }
                                        setOpen(false);
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

function ActorFilter({ selected, onSelect, onRemove }: { selected: Actor[], onSelect: (actor: Actor) => void, onRemove: (actorId: number) => void }) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [searchResults, setSearchResults] = React.useState<Actor[]>([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (searchQuery.length > 2) {
            setLoading(true);
            const timer = setTimeout(async () => {
                const results = await searchActors(searchQuery);
                setSearchResults(results);
                setLoading(false);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="justify-between w-full md:w-auto">
                    Actors
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput
                        placeholder="Search for an actor..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                     <CommandList>
                        {loading && <CommandItem disabled>Loading...</CommandItem>}
                        <CommandEmpty>{!loading && "No actors found."}</CommandEmpty>
                        <CommandGroup>
                            {searchResults.map((actor) => (
                                <CommandItem
                                    key={actor.id}
                                    value={actor.name}
                                    onSelect={() => {
                                        onSelect(actor);
                                        setSearchQuery("");
                                        setOpen(false);
                                    }}
                                >
                                    {actor.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                     </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export default function Home() {
    const [selectedMovie, setSelectedMovie] = React.useState<Movie | null>(null);
    const [moviesByCat, setMoviesByCat] = React.useState<Record<string, Movie[]>>({});
    const [genres, setGenres] = React.useState<Genre[]>([]);
    const [languages, setLanguages] = React.useState<Language[]>([]);
    const [platforms, setPlatforms] = React.useState<WatchProvider[]>([]);
    
    const [selectedGenres, setSelectedGenres] = React.useState<Genre[]>([]);
    const [selectedLanguages, setSelectedLanguages] = React.useState<Language[]>([]);
    const [selectedActors, setSelectedActors] = React.useState<Actor[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = React.useState<WatchProvider[]>([]);
    const [selectedRecency, setSelectedRecency] = React.useState('all');
    
    const [filteredMovies, setFilteredMovies] = React.useState<Movie[]>([]);
    const [isFilteredView, setIsFilteredView] = React.useState(false);
    
    const [loading, setLoading] = React.useState(true);
    const [loadingFilteredMovies, setLoadingFilteredMovies] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    
    const hasActiveFilters = selectedGenres.length > 0 || selectedLanguages.length > 0 || selectedActors.length > 0 || selectedPlatforms.length > 0 || selectedRecency !== 'all';
    
    React.useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [genresData, languagesData, platformsData, ...categoryMoviesData] = await Promise.all([
                    getGenres(),
                    getLanguages(),
                    getPlatforms(),
                    ...movieCategories.map(category => getMoviesByCategory(category.id)),
                ]);

                setGenres(genresData);
                setLanguages(languagesData);
                setPlatforms(platformsData);

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
                    languages: selectedLanguages.map(l => l.iso_639_1),
                    actors: selectedActors.map(a => a.id),
                    platforms: selectedPlatforms.map(p => p.id),
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

    }, [selectedGenres, selectedLanguages, selectedActors, selectedPlatforms, selectedRecency, hasActiveFilters])

    const toggleSelection = <T extends {id: any}>(list: T[], item: T): T[] => {
        if (list.some(g => g.id === item.id)) {
            return list.filter(g => g.id !== item.id);
        } else {
            return [...list, item];
        }
    };
    
    const handleGenreSelect = (genre: Genre) => setSelectedGenres(prev => toggleSelection(prev, genre));
    const handleLanguageSelect = (language: Language) => {
        setSelectedLanguages(prev => {
            if (prev.some(l => l.iso_639_1 === language.iso_639_1)) {
                return prev.filter(l => l.iso_639_1 !== language.iso_639_1);
            }
            return [...prev, language];
        });
    };
    const handlePlatformSelect = (platform: WatchProvider) => setSelectedPlatforms(prev => toggleSelection(prev, platform));
    const handleActorSelect = (actor: Actor) => {
        if (!selectedActors.some(a => a.id === actor.id)) {
            setSelectedActors(prev => [...prev, actor]);
        }
    }
    const handleActorRemove = (actorId: number) => setSelectedActors(prev => prev.filter(a => a.id !== actorId));

    const handleClearFilters = () => {
        setSelectedGenres([]);
        setSelectedLanguages([]);
        setSelectedActors([]);
        setSelectedPlatforms([]);
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
    const removeLanguage = (iso: string) => setSelectedLanguages(prev => prev.filter(l => l.iso_639_1 !== iso));
    const removePlatform = (id: number) => setSelectedPlatforms(prev => prev.filter(p => p.id !== id));

    return (
        <>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                     <h2 className="text-xl font-headline font-bold text-primary">Discover Movies</h2>
                     {hasActiveFilters && <Button variant="ghost" onClick={handleClearFilters}>Clear Filters</Button>}
                </div>
                <div className="flex flex-wrap gap-4 items-start">
                    <MultiSelectFilter title="Genres" options={genres} selected={selectedGenres} onSelect={handleGenreSelect} />
                    <MultiSelectFilter title="Languages" options={languages.map(l => ({...l, id: l.iso_639_1, name: l.english_name}))} selected={selectedLanguages.map(l => ({...l, id: l.iso_639_1, name: l.english_name}))} onSelect={handleLanguageSelect} />
                    <MultiSelectFilter title="Platforms" options={platforms} selected={selectedPlatforms} onSelect={handlePlatformSelect} />
                    <ActorFilter selected={selectedActors} onSelect={handleActorSelect} onRemove={handleActorRemove} />
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
                        {selectedLanguages.map(l => (
                             <Badge key={l.iso_639_1} variant="secondary">
                                {l.english_name}
                                 <button onClick={() => removeLanguage(l.iso_639_1)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                        {selectedPlatforms.map(p => (
                            <Badge key={p.id} variant="secondary">
                                {p.name}
                                <button onClick={() => removePlatform(p.id)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                         {selectedActors.map(actor => (
                            <Badge key={actor.id} variant="secondary">
                                {actor.name}
                                <button onClick={() => handleActorRemove(actor.id)} className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
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
