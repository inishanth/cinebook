
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Movie, MovieDetails, Genre, Person } from '@/types';
import { sub, format, startOfMonth, endOfMonth } from 'date-fns';

let supabase: ReturnType<typeof createClient>;

function getSupabaseClient() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    if (!process.env.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_ANON_KEY environment variable is not set');
    }
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  }
  return supabase;
}

async function handleSupabaseError<T>(response: { data: T; error: any }): Promise<T> {
  if (response.error) {
    if (response.error.code === 'PGRST116') { // PGRST116 is the code for "No rows found"
        throw new Error('Movie not found in Supabase');
    }
    console.error('Supabase Query Error:', response.error);
    throw new Error(`Failed to fetch data from Supabase. Details: ${response.error.message}`);
  }
  return response.data;
}

export const getMoviesByCategory = async (categoryId: string, page = 0): Promise<Movie[]> => {
    const supabase = getSupabaseClient();
    const pageSize = 20;
    const offset = page * pageSize;
    
    let query = supabase.from('movies').select('*');

    switch (categoryId) {
        case 'popular':
            query = query
                .gte('vote_count', 10)
                .order('release_date', { ascending: false })
                .order('vote_average', { ascending: false, nullsFirst: false });
            break;
        case 'top_rated':
            query = query.order('vote_average', { ascending: false, nullsFirst: false }).gte('vote_count', 10);
            break;
        case 'recently_released':
            query = query.order('release_date', { ascending: false }).lte('release_date', new Date().toISOString());
            break;
        default:
            query = query.order('vote_average', { ascending: false });
            break;
    }

    const response = await query.range(offset, offset + pageSize - 1);
    
    return handleSupabaseError(response);
}

const getMovieDetailsFromTMDB = async (movieId: number): Promise<MovieDetails> => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
      throw new Error('TMDB API key is not configured.');
    }
  
    const url = new URL(`https://api.themoviedb.org/3/movie/${movieId}`);
    url.searchParams.append('api_key', apiKey);
    url.searchParams.append('append_to_response', 'credits,videos');
  
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to fetch from TMDB: ${errorData.status_message}`);
      }
      const data = await response.json();
  
      return {
        id: data.id,
        title: data.title,
        poster_url: data.poster_path,
        backdrop_path: data.backdrop_path,
        overview: data.overview,
        release_date: data.release_date,
        vote_average: data.vote_average,
        vote_count: data.vote_count,
        language: data.original_language,
        genres: data.genres || [],
        runtime: data.runtime,
        cast: (data.credits?.cast || []).slice(0, 3).map((c: any) => c.name),
        videos: data.videos || { results: [] },
        credits: data.credits || { cast: [], crew: [] },
        release_dates: { results: [] }, // Mocked as not needed for this path
      };
    } catch (error) {
      console.error('Error fetching movie details from TMDB:', error);
      throw error;
    }
  };

export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
    try {
        const supabase = getSupabaseClient();

        const movieResponse = await supabase
          .from('movies')
          .select(`*`)
          .eq('id', movieId)
          .single();

        const movieData = await handleSupabaseError(movieResponse);
        
        const genresResponse = await supabase
            .from('movie_genres')
            .select(`genres(id, name)`)
            .eq('movie_id', movieId);
            
        const genresData = await handleSupabaseError(genresResponse);
        const genres = (genresData || []).map((g: any) => g.genres).filter(Boolean);

        const { data: castData, error: castError } = await supabase
            .from('movie_cast')
            .select(`
                cast_order,
                cast_members ( name )
            `)
            .eq('movie_id', movieId)
            .in('cast_order', [0, 1, 2])
            .order('cast_order', { ascending: true });

        if (castError) {
            console.error('Error fetching cast:', castError);
        }
        
        const cast = (castData || [])
            .map(c => c.cast_members?.name)
            .filter((name, index, self) => name && self.indexOf(name) === index) as string[];

        return {
            ...movieData,
            genres,
            cast,
            videos: { results: [] },
            credits: { cast: [], crew: [] }, 
            release_dates: { results: [] },
        } as MovieDetails;
    } catch (error: any) {
        if (error.message.includes('Movie not found in Supabase')) {
            // If the movie is not in our DB, fetch from TMDB as a fallback
            return getMovieDetailsFromTMDB(movieId);
        }
        // Re-throw other errors
        throw error;
    }
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
    if (!query) return [];
    const supabase = getSupabaseClient();
    const response = await supabase
        .from('movies')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(20);
        
    return handleSupabaseError(response);
}

export const discoverMovies = async ({
    genreId,
    language,
    recency,
    personId,
}: {
    genreId?: string,
    language?: string,
    recency?: string,
    personId?: string,
}): Promise<Movie[]> => {
    const supabase = getSupabaseClient();
    let query;

    if (personId && personId !== 'all') {
        const personQuery = supabase
            .from('movie_cast')
            .select(`
                movies (
                    *,
                    movie_genres!inner(genre_id)
                )
            `)
            .eq('person_id', parseInt(personId));

        let moviesQuery = personQuery;
        
        let moviesData = (await moviesQuery).data?.map(mc => mc.movies).flat();

        if (genreId && genreId !== 'all') {
            moviesData = moviesData?.filter(m => m?.movie_genres.some((mg: any) => mg.genre_id === parseInt(genreId)));
        }
        
        // Cannot filter by language and recency on this path currently
        return (moviesData?.filter(Boolean) as Movie[]) || [];


    } else {
        query = supabase.from('movies').select(`
            *,
            movie_genres!inner(genre_id)
        `);
         if (genreId && genreId !== 'all') {
            query = query.eq('movie_genres.genre_id', parseInt(genreId));
        }

    }


    if (language && language !== 'all') {
        query = query.eq('language', language);
    }

    if (recency && recency !== 'all') {
        const now = new Date();
        let fromDate: Date | null = null;
        let toDate: Date | null = new Date();

        switch (recency) {
            case '6m':
                fromDate = sub(now, { months: 6 });
                break;
            case '1y':
                fromDate = sub(now, { years: 1 });
                break;
            case '5y':
                fromDate = sub(now, { years: 5 });
                break;
            case '5y+':
                toDate = sub(now, { years: 5 });
                fromDate = null; // No lower bound
                break;
        }

        if (fromDate) {
             query = query.gte('release_date', format(fromDate, 'yyyy-MM-dd'));
        }
        if (toDate) {
            query = query.lte('release_date', format(toDate, 'yyyy-MM-dd'));
        }
    }
    
    query = query.order('release_date', { ascending: false }).limit(50);
    
    const response = await query;
    return handleSupabaseError(response);
};

export const getGenres = async (): Promise<Genre[]> => {
    const supabase = getSupabaseClient();
    const response = await supabase
        .from('genres')
        .select('id, name')
        .order('name', { ascending: true });
    return handleSupabaseError(response);
};

export const getLanguages = async (): Promise<string[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('movies')
        .select('language');

     if (error) {
        console.error('Supabase Error getting languages:', error);
        throw new Error(error.message);
    }
    
    if (!data) return [];
    
    const languages = data.map(item => item.language).filter(Boolean);
    const uniqueLanguages = [...new Set(languages)];
    return uniqueLanguages.sort();
};


export const getLeadActors = async (): Promise<Person[]> => {
    const supabase = getSupabaseClient();
    const { data: people, error: peopleError } = await supabase
        .from('cast_members')
        .select('id, name')
        .limit(100);

    if (peopleError) {
        console.error('Supabase Error getting cast members:', peopleError);
        throw new Error(peopleError.message);
    }
    
    return people.sort((a,b) => a.name.localeCompare(b.name));
};

export const getUpcomingMovies = async ({ language, region }: { language: string, region: string }): Promise<Movie[]> => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'your_tmdb_api_key_here') {
      console.error('TMDB API key is not configured. Please add it to your .env file.');
      return [];
    }
  
    const today = new Date().toISOString().split('T')[0];
    const url = new URL('https://api.themoviedb.org/3/discover/movie');
    const params = {
      api_key: apiKey,
      language: language,
      region: region,
      'release_date.gte': today,
      sort_by: 'primary_release_date.asc',
      page: '1',
    };
    
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key as keyof typeof params]));
  
    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        const errorData = await response.json();
        console.error('TMDB API Error:', errorData);
        throw new Error(`Failed to fetch from TMDB: ${errorData.status_message}`);
      }
      const data = await response.json();
      
      return data.results.map((tmdbMovie: any) => ({
        id: tmdbMovie.id,
        title: tmdbMovie.title,
        poster_url: tmdbMovie.poster_path,
        backdrop_path: tmdbMovie.backdrop_path,
        overview: tmdbMovie.overview,
        release_date: tmdbMovie.release_date,
        vote_average: tmdbMovie.vote_average,
        language: tmdbMovie.original_language,
        vote_count: tmdbMovie.vote_count,
        runtime: tmdbMovie.runtime,
      }));
    } catch (error) {
      console.error('Error fetching upcoming movies from TMDB:', error);
      throw error;
    }
  };
