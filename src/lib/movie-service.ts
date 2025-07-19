import type { Movie, MovieDetails, Genre, Actor, Language } from '@/types';

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
        default:
             endpoint = '/movie/popular';
    }

    const data = await get<{ results: Movie[] }>(endpoint);
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
    const data = await get<Language[]>('/configuration/languages');
    return data.filter(lang => lang.english_name); // Filter out languages without an english name
};

export const searchActors = async (query: string): Promise<Actor[]> => {
    if (!query) return [];
    const data = await get<{ results: Actor[] }>('/search/person', { query });
    return data.results;
}

export const discoverMovies = async ({ genres, languages, actors }: { genres: number[], languages: string[], actors: number[] }): Promise<Movie[]> => {
    const params: Record<string, string> = {};
    if (genres.length > 0) params.with_genres = genres.join(',');
    if (languages.length > 0) params.with_original_language = languages.join(',');
    if (actors.length > 0) params.with_cast = actors.join(',');
    
    const data = await get<{ results: Movie[] }>('/discover/movie', params);
    return data.results;
}

export const getMoviesByGenre = async (genreId: number): Promise<Movie[]> => {
    const data = await get<{ results: Movie[] }>('/discover/movie', { with_genres: String(genreId) });
    return data.results;
}
