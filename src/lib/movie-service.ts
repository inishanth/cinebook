
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

export const getTrendingMovies = async (): Promise<Movie[]> => {
    const supabase = getSupabaseClient();
    const response = await supabase
        .from('movies')
        .select('*')
        .order('release_date', { ascending: false })
        .limit(20);
    return handleSupabaseError(response);
};

export const getMoviesByCategory = async (categoryId: string): Promise<Movie[]> => {
    const supabase = getSupabaseClient();
    let query = supabase.from('movies').select('*');
    
    switch(categoryId) {
        case 'popular':
            query = query.order('vote_count', { ascending: false, nullsFirst: false });
            break;
        case 'top_rated':
            query = query.gte('vote_count', 10).order('vote_average', { ascending: false, nullsFirst: false });
            break;
        case 'upcoming':
            query = query.filter('release_date', 'gt', new Date().toISOString()).order('release_date', { ascending: true });
            break;
        case 'now_playing':
            const oneMonthAgo = sub(new Date(), { months: 1 });
            query = query
                .filter('release_date', 'lte', new Date().toISOString())
                .filter('release_date', 'gte', oneMonthAgo.toISOString())
                .order('release_date', { ascending: false });
            break;
        default:
             query = query.order('release_date', { ascending: false });
    }

    const response = await query.limit(20);
    return handleSupabaseError(response);
}

export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
    const supabase = getSupabaseClient();
    const response = await supabase
      .from('movies')
      .select(`
        *,
        genres:movie_genres!inner(
            genres(id, name)
        )
      `)
      .eq('id', movieId)
      .single();

    const movieData = await handleSupabaseError(response);
    
    if (!movieData) {
        throw new Error('Movie not found');
    }
    
    // The query above returns genres in a nested structure. We need to flatten it.
    const genres = (movieData.genres || []).map((g: any) => g.genres).filter(Boolean);

    return {
        ...movieData,
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
    
    let fromTable = 'movies';
    let selectString = '*';
    let query;

    // If filtering by genre or person, we start from a different table.
    if ((genreId && genreId !== 'all') || (personId && personId !== 'all')) {
      if (personId && personId !== 'all') {
        fromTable = 'movie_cast';
        selectString = 'movies(*)';
        query = supabase.from(fromTable).select(selectString).eq('person_id', personId).eq('cast_order', 0);
      } else if (genreId && genreId !== 'all') {
        fromTable = 'movie_genres';
        selectString = 'movies(*)';
        query = supabase.from(fromTable).select(selectString).eq('genre_id', genreId);
      } else {
        query = supabase.from(fromTable).select(selectString);
      }
    } else {
        query = supabase.from(fromTable).select(selectString);
    }
    
    if (language && language !== 'all') {
        query = query.eq('language', language);
    }

    if (recency && recency !== 'all') {
        const today = new Date();
        let fromDate: Date;
        
        switch (recency) {
            case '6m':
                fromDate = sub(today, { months: 6 });
                query = query.gte('release_date', format(fromDate, 'yyyy-MM-dd'));
                break;
            case '1y':
                fromDate = sub(today, { years: 1 });
                query = query.gte('release_date', format(fromDate, 'yyyy-MM-dd'));
                break;
            case '5y':
                fromDate = sub(today, { years: 5 });
                query = query.gte('release_date', format(fromDate, 'yyyy-MM-dd'));
                break;
            case '5y+':
                const fiveYearsAgo = sub(today, { years: 5 });
                query = query.lte('release_date', format(fiveYearsAgo, 'yyyy-MM-dd'));
                break;
        }
    }
    
    const response = await query
        .order('release_date', { ascending: false })
        .limit(40);
    
    let data = await handleSupabaseError(response);
    
    // If we queried from a join table, the data is nested.
    if (fromTable !== 'movies') {
        data = data.map((item: any) => item.movies).filter(Boolean);
    }

    // The data might contain duplicates if a movie matches multiple criteria in joins.
    const uniqueMovies: Movie[] = [];
    const movieIds = new Set();
    
    for (const movie of data) {
      if (movie && !movieIds.has(movie.id)) {
          uniqueMovies.push(movie);
          movieIds.add(movie.id);
      }
    }
    return uniqueMovies;
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
    const response = await supabase
        .from('movies')
        .select('language');
    
    const data = await handleSupabaseError(response);
    const languages = data.map((m: { language: string }) => m.language);
    return [...new Set(languages)].filter(Boolean).sort();
};

export const getLeadActors = async (): Promise<Person[]> => {
    const supabase = getSupabaseClient();
    const response = await supabase
        .from('movie_cast')
        .select('people:person_id(id, name)')
        .eq('cast_order', 0);
    
    const data = await handleSupabaseError(response);

    const personMap = new Map<number, Person>();
    data.forEach((item: any) => {
        if (item.people && !personMap.has(item.people.id)) {
            personMap.set(item.people.id, item.people);
        }
    });

    return Array.from(personMap.values()).sort((a,b) => a.name.localeCompare(b.name));
};
