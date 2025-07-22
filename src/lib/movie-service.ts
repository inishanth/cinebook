
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
        .limit(25);
    return handleSupabaseError(response);
};

// Function to shuffle an array
const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export const getMoviesByCategory = async (categoryId: string): Promise<Movie[]> => {
    const supabase = getSupabaseClient();
    let query = supabase.from('movies').select('*');
    let shouldShuffle = false;
    
    switch(categoryId) {
        case 'popular':
            query = query.order('vote_count', { ascending: false, nullsFirst: false });
            shouldShuffle = true;
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
            shouldShuffle = true;
            break;
        default:
             query = query.order('release_date', { ascending: false });
    }

    const response = await query.limit(25);
    const movies = await handleSupabaseError(response);
    
    if (shouldShuffle) {
        return shuffleArray(movies);
    }
    
    return movies;
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
    
    const hasGenreFilter = genreId && genreId !== 'all';
    const hasActorFilter = personId && personId !== 'all';

    let joinTables = '';
    if (hasGenreFilter) {
        joinTables += ', movie_genres!inner(genre_id)';
    }
    if (hasActorFilter) {
        joinTables += ', movie_cast!inner(person_id)';
    }

    let query = supabase.from('movies').select(`* ${joinTables}`);
    
    if (hasGenreFilter) {
        query = query.eq('movie_genres.genre_id', genreId);
    }

    if (hasActorFilter) {
        query = query.eq('movie_cast.person_id', personId);
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
    
    const data = await handleSupabaseError(response);
    
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
    const { data: leadCast, error } = await supabase
        .from('movie_cast')
        .select('person_id')
        .eq('cast_order', 0)
        .limit(100);

    if (error) {
        console.error('Supabase Error getting lead cast:', error);
        throw new Error(error.message);
    }

    const personIds = [...new Set(leadCast.map(c => c.person_id))];

    const { data: people, error: peopleError } = await supabase
        .from('cast_members')
        .select('id, name')
        .in('id', personIds);

    if (peopleError) {
        console.error('Supabase Error getting cast members:', peopleError);
        throw new Error(peopleError.message);
    }
    
    return people.sort((a,b) => a.name.localeCompare(b.name));
};
