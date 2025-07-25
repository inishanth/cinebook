
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
        case 'upcoming':
            query = query.order('release_date', { ascending: true }).gte('release_date', new Date().toISOString());
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

export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
    const supabase = getSupabaseClient();

    const movieResponse = await supabase
      .from('movies')
      .select(`*`)
      .eq('id', movieId)
      .single();

    const movieData = await handleSupabaseError(movieResponse);
    
    if (!movieData) {
        throw new Error('Movie not found');
    }
    
    const genresResponse = await supabase
        .from('movie_genres')
        .select(`genres(id, name)`)
        .eq('movie_id', movieId);
        
    const genresData = await handleSupabaseError(genresResponse);
    const genres = (genresData || []).map((g: any) => g.genres).filter(Boolean);

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

    return {
        ...movieData,
        genres,
        cast,
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

    let query = supabase.from('movies').select(`
        *,
        movie_genres!inner(genre_id),
        movie_cast!inner(person_id)
    `);

    if (genreId && genreId !== 'all') {
        query = query.eq('movie_genres.genre_id', parseInt(genreId));
    }
    
    if (personId && personId !== 'all') {
        query = query.eq('movie_cast.person_id', parseInt(personId));
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

export const getUpcomingMovies = async (language: string): Promise<Movie[]> => {
    const supabase = getSupabaseClient();
    const query = supabase
        .from('movies')
        .select('*')
        .eq('language', language)
        .gte('release_date', new Date().toISOString())
        .order('release_date', { ascending: true })
        .limit(20);
    
    return handleSupabaseError(await query);
};
