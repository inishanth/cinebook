
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
    let movies = await handleSupabaseError(response);
    
    if (categoryId === 'recently_released') {
        movies = movies.sort((a, b) => {
            const scoreA = a.vote_average * a.vote_count;
            const scoreB = b.vote_average * b.vote_count;
            return scoreB - scoreA;
        });
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
    
    const genreMap = new Map();
    (movieData.genres || []).forEach((g: any) => {
        if(g.genres) {
            genreMap.set(g.genres.id, g.genres);
        }
    });

    const genres = Array.from(genreMap.values());

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
    
    let query = supabase.from('movies').select('*, movie_genres!inner(genre_id), movie_cast!inner(person_id)');
    
    if (genreId && genreId !== 'all') {
        query = query.eq('movie_genres.genre_id', genreId);
    }

    if (personId && personId !== 'all') {
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
    
    const movieMap = new Map<number, Movie>();
    for (const movie of data) {
        if (movie && !movieMap.has(movie.id)) {
            movieMap.set(movie.id, movie as Movie);
        }
    }

    return Array.from(movieMap.values());
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
    const response = await supabase.from('movies').select('language');
    
    const data = await handleSupabaseError(response);
    const languages = data.map((l: { language: string }) => l.language);
    const uniqueLanguages = [...new Set(languages)];
    return uniqueLanguages.filter(Boolean).sort();
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

