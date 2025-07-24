
'use server';

import { createClient } from '@supabase/supabase-js';
import type { Movie, MovieDetails, Genre, Person } from '@/types';
import { sub, format } from 'date-fns';

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
    console.error('Supabase Query Error:', response.error);
    throw new Error(`Failed to fetch data from Supabase. Details: ${response.error.message}`);
  }
  return response.data;
}

export const getMovieCredits = async (movieId: number): Promise<{ director: string | null; cast: string[] }> => {
    const supabase = getSupabaseClient();

    // Get Director
    const { data: directorData, error: directorError } = await supabase
        .from('movie_crew')
        .select(`
            crew:cast_members ( name )
        `)
        .eq('movie_id', movieId)
        .eq('job', 'Director')
        .limit(1)
        .single();
    
    if (directorError && directorError.code !== 'PGRST116') { // Ignore 'single row not found'
        console.error('Error fetching director:', directorError);
    }
    const director = directorData?.crew?.name || null;

    // Get Top 3 Cast
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

    
    return { director, cast };
}

export const getMoviesByCategory = async (categoryId: string): Promise<Movie[]> => {
    const supabase = getSupabaseClient();
    let query = supabase.from('movies')
        .select(`*`);
        
    switch(categoryId) {
        case 'popular':
            query = query.order('vote_count', { ascending: false, nullsFirst: false });
            break;
        case 'top_rated':
            query = query.gte('vote_count', 100).order('vote_average', { ascending: false, nullsFirst: false });
            break;
        case 'upcoming':
            query = query.filter('release_date', 'gt', new Date().toISOString()).order('release_date', { ascending: true });
            break;
        case 'recently_released':
            const oneMonthAgo = sub(new Date(), { months: 1 });
            query = query
                .filter('release_date', 'lte', new Date().toISOString())
                .filter('release_date', 'gte', oneMonthAgo.toISOString())
                .order('release_date', { ascending: false });
            break;
        default:
             query = query.order('release_date', { ascending: false });
    }

    const response = await query.limit(15);
    const movies = await handleSupabaseError(response);
    
    return movies;
}

export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('movies')
      .select(`
        *,
        genres:movie_genres(
            genres(id, name)
        )
      `)
      .eq('id', movieId)
      .single();

    const movieData = await handleSupabaseError(response);
    
    if (!movieData) {
        throw new Error('Movie not found');
    }
    
    const genres = (movieData.genres || []).map((g: any) => g.genres).filter(Boolean);

    const credits = await getMovieCredits(movieId);

    return {
        ...movieData,
        ...credits,
        genres,
        videos: { results: [] }, // Mocked as not in schema
        credits: { cast: [], crew: [] }, // Mocked as not in schema
        release_dates: { results: [] }, // Mocked as not in schema
    } as MovieDetails;
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
    
    const params: any = {
        p_limit: 40,
        p_genre_id: null,
        p_person_id: null,
        p_language: null,
        p_recency: null,
    };

    if (genreId && genreId !== 'all') {
        params.p_genre_id = parseInt(genreId);
    }
    if (personId && personId !== 'all') {
        params.p_person_id = parseInt(personId);
    }
    if (language && language !== 'all') {
        params.p_language = language;
    }
    if (recency && recency !== 'all') {
        params.p_recency = recency;
    }

    const { data, error } = await supabase.rpc('discover_movies', params);
    
    if (error) {
        console.error('Supabase RPC Error:', error);
        throw new Error(`Failed to fetch discovered movies. Details: ${error.message}`);
    }

    return data as Movie[];
}

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
    const response = await supabase.rpc('get_distinct_languages');
    
    const data = await handleSupabaseError(response);
    return data.sort();
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