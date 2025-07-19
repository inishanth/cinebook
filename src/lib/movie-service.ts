import type { Movie, MovieDetails, Genre, Actor, Language, WatchProvider } from '@/types';
import { sub, format } from 'date-fns';

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

const get = async <T>(path: string, params: Record<string, string> = {}): Promise<T> => {
  if (!API_KEY) {
    throw new Error('TMDb API key is not configured. Please add NEXT_PUBLIC_TMDB_API_KEY to your .env.local file.');
  }

  const urlParams = new URLSearchParams({
    api_key: API_KEY,
    ...params,
  });

  const url = `${API_BASE_URL}${path}?${urlParams.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      const errorBody = await res.json().catch(() => ({})); // Catch if body isn't valid JSON
      console.error('Error body:', errorBody);
      throw new Error(`Failed to fetch data from TMDb. Status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error('Network or fetch error:', error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
    throw new Error('Failed to connect to TMDb API.');
  }
};

export const getPosterUrl = (path: string | null, size: 'w500' | 'original' = 'w500') => {
  return path ? `${IMAGE_BASE_URL}${size}${path}` : 'https://placehold.co/500x750.png';
};

export const getBannerUrl = (path: string | null, size: 'original' | 'w1280' = 'original') => {
  return path ? `${IMAGE_BASE_URL}${size}${path}` : 'https://placehold.co/1280x720.png';
};

export const getTrendingMovies = async (): Promise<Movie[]> => {
  const data = await get<{ results: Movie[] }>('/trending/movie/week');
  return data.results;
};

export const getMoviesByCategory = async (categoryId: string): Promise<Movie[]> => {
    let endpoint = '';
    let params: Record<string, string> = {};

    switch(categoryId) {
        case 'popular':
            endpoint = '/movie/popular';
            break;
        case 'top_rated':
            endpoint = '/movie/top_rated';
            break;
        case 'upcoming':
            endpoint = '/movie/upcoming';
            break;
        case 'now_playing':
            endpoint = '/movie/now_playing';
            break;
        case 'action':
             endpoint = '/discover/movie';
             params = { with_genres: '28' };
             break;
        case 'comedy':
             endpoint = '/discover/movie';
             params = { with_genres: '35' };
             break;
        default:
             endpoint = '/movie/popular';
    }

    const data = await get<{ results: Movie[] }>(endpoint, params);
    return data.results;
}


export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
    return get<MovieDetails>(`/movie/${movieId}`, { append_to_response: 'videos,credits,release_dates' });
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
    if (!query) return [];
    const data = await get<{ results: Movie[] }>('/search/movie', { query });
    return data.results;
}

export const getGenres = async (): Promise<Genre[]> => {
    const data = await get<{ genres: Genre[] }>('/genre/movie/list');
    return data.genres;
};

export const getLanguages = async (): Promise<Language[]> => {
    // Return a curated list of languages to avoid overwhelming the user.
    const curatedLanguages: Omit<Language, 'name' | 'id'>[] = [
        { iso_639_1: 'en', english_name: 'English' },
        { iso_639_1: 'es', english_name: 'Spanish' },
        { iso_639_1: 'fr', english_name: 'French' },
        { iso_639_1: 'de', english_name: 'German' },
        { iso_639_1: 'it', english_name: 'Italian' },
        { iso_639_1: 'ja', english_name: 'Japanese' },
        { iso_639_1: 'ko', english_name: 'Korean' },
        { iso_639_1: 'pt', english_name: 'Portuguese' },
        { iso_639_1: 'ru', english_name: 'Russian' },
        { iso_639_1: 'zh', english_name: 'Chinese' },
        { iso_639_1: 'hi', english_name: 'Hindi' },
        { iso_639_1: 'ta', english_name: 'Tamil' },
        { iso_639_1: 'te', english_name: 'Telugu' },
        { iso_639_1: 'ml', english_name: 'Malayalam' },
        { iso_639_1: 'kn', english_name: 'Kannada' },
        { iso_639_1: 'bn', english_name: 'Bengali' },
        { iso_639_1: 'pa', english_name: 'Punjabi' },
        { iso_639_1: 'ar', english_name: 'Arabic' },
        { iso_639_1: 'tr', english_name: 'Turkish' },
    ];
    return Promise.resolve(curatedLanguages.map(l => ({ ...l, id: l.iso_639_1, name: l.english_name })));
};

export const getPlatforms = async (): Promise<WatchProvider[]> => {
    const popularPlatforms: WatchProvider[] = [
        { id: 8, name: 'Netflix' },
        { id: 9, name: 'Prime Video' },
        { id: 15, name: 'Hulu' },
        { id: 337, name: 'Disney+' },
        { id: 384, name: 'Max' },
        { id: 350, name: 'Apple TV+' },
    ];
    return Promise.resolve(popularPlatforms);
}

export const searchActors = async (query: string): Promise<Actor[]> => {
    if (!query) return [];
    const data = await get<{ results: Actor[] }>('/search/person', { query });
    return data.results;
}

export const discoverMovies = async ({ genres, languages, actors, platforms, recency }: { genres: number[], languages: string[], actors: number[], platforms: number[], recency?: string }): Promise<Movie[]> => {
    const params: Record<string, string> = {
        'watch_region': 'US', // Required for watch provider filtering
    };
    if (genres.length > 0) params.with_genres = genres.join('|');
    if (languages.length > 0) params.with_original_language = languages.join('|');
    if (actors.length > 0) params.with_cast = actors.join('|');
    if (platforms.length > 0) params.with_watch_providers = platforms.join('|');
    
    if (recency && recency !== 'all') {
        const today = new Date();
        let fromDate: Date;
        
        switch (recency) {
            case '6m':
                fromDate = sub(today, { months: 6 });
                params['primary_release_date.gte'] = format(fromDate, 'yyyy-MM-dd');
                break;
            case '1y':
                fromDate = sub(today, { years: 1 });
                params['primary_release_date.gte'] = format(fromDate, 'yyyy-MM-dd');
                break;
            case '5y':
                fromDate = sub(today, { years: 5 });
                params['primary_release_date.gte'] = format(fromDate, 'yyyy-MM-dd');
                break;
            case '5y+':
                const fiveYearsAgo = sub(today, { years: 5 });
                params['primary_release_date.lte'] = format(fiveYearsAgo, 'yyyy-MM-dd');
                break;
        }
    }
    
    const data = await get<{ results: Movie[] }>('/discover/movie', params);
    return data.results;
}

export const getMoviesByGenre = async (genreId: number): Promise<Movie[]> => {
    const data = await get<{ results: Movie[] }>('/discover/movie', { with_genres: String(genreId) });
    return data.results;
}
