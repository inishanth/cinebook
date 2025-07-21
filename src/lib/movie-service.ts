'use server';

import { createClient } from '@supabase/supabase-js';
import type { Movie, MovieDetails } from '@/types';
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
            query = query.order('release_date', { ascending: false });
            break;
        case 'top_rated':
            query = query.order('vote_average', { ascending: false });
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
      .select('*')
      .eq('id', movieId)
      .single();

    const movie = await handleSupabaseError(response);
    
    if (!movie) {
        throw new Error('Movie not found');
    }
    
    return {
        ...movie,
        genres: [],
        runtime: 120, // Mocked value
        videos: { results: [] },
        credits: { cast: [], crew: [] },
        release_dates: { results: [] },
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
    recency,
}: {
    recency?: string,
}): Promise<Movie[]> => {
    const supabase = getSupabaseClient();
    let query = supabase.from('movies').select('*');

    if (recency && recency !== 'all') {
        const today = new Date();
        let fromDate: Date;
        
        switch (recency) {
            case '6m':
                fromDate = sub(today, { months: 6 });
                query = query.filter('release_date', 'gte', format(fromDate, 'yyyy-MM-dd'));
                break;
            case '1y':
                fromDate = sub(today, { years: 1 });
                query = query.filter('release_date', 'gte', format(fromDate, 'yyyy-MM-dd'));
                break;
            case '5y':
                fromDate = sub(today, { years: 5 });
                query = query.filter('release_date', 'gte', format(fromDate, 'yyyy-MM-dd'));
                break;
            case '5y+':
                const fiveYearsAgo = sub(today, { years: 5 });
                query = query.filter('release_date', 'lte', format(fiveYearsAgo, 'yyyy-MM-dd'));
                break;
        }
    }
    
    const response = await query
        .order('release_date', { ascending: false })
        .limit(40);
    
    return handleSupabaseError(response);
}
