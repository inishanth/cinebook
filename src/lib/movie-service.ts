import { Pool } from '@neondatabase/serverless';
import type { Movie, MovieDetails, Genre, Language, Platform, Actor } from '@/types';
import { sub, format } from 'date-fns';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const runQuery = async <T>(query: string, params: any[] = []): Promise<T[]> => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Database Query Error:', error);
    throw new Error('Failed to fetch data from the database.');
  } finally {
    client.release();
  }
};


export const getPosterUrl = (path: string | null, size: 'w92' | 'w500' | 'original' = 'w500') => {
  // Assuming poster_path is a full URL now, or we use a placeholder
  return path || 'https://placehold.co/500x750.png';
};

export const getBannerUrl = (path: string | null, size: 'original' | 'w1280' = 'original') => {
  // Assuming backdrop_path is a full URL now, or we use a placeholder
  return path || 'https://placehold.co/1280x720.png';
};

export const getTrendingMovies = async (): Promise<Movie[]> => {
    // Assuming a 'trending' flag or ordering by popularity
    const query = `
        SELECT * FROM movies
        ORDER BY popularity DESC
        LIMIT 20;
    `;
    return runQuery<Movie>(query);
};

export const getMoviesByCategory = async (categoryId: string): Promise<Movie[]> => {
    let query = '';
    
    // This assumes your `movies` table has columns like `popularity`, `vote_average`, 
    // `release_date` and a status for 'upcoming' or 'now_playing'.
    // This is a simplified example. A real implementation might involve more complex queries or table structures.
    switch(categoryId) {
        case 'popular':
            query = 'SELECT * FROM movies ORDER BY popularity DESC LIMIT 20;';
            break;
        case 'top_rated':
            query = 'SELECT * FROM movies ORDER BY vote_average DESC LIMIT 20;';
            break;
        case 'upcoming':
            query = `SELECT * FROM movies WHERE release_date > NOW() ORDER BY release_date ASC LIMIT 20;`;
            break;
        case 'now_playing':
            query = `SELECT * FROM movies WHERE release_date <= NOW() AND release_date >= NOW() - interval '1 month' ORDER BY release_date DESC LIMIT 20;`;
            break;
        default:
             query = 'SELECT * FROM movies ORDER BY popularity DESC LIMIT 20;';
    }

    return runQuery<Movie>(query);
}

export const getGenres = async (): Promise<Genre[]> => {
  const query = 'SELECT * FROM genres ORDER BY name;';
  return runQuery<Genre>(query);
};

export const getLanguages = async (): Promise<Language[]> => {
    const query = `SELECT * FROM languages ORDER BY english_name;`;
    return runQuery<Language>(query);
};

export const getPlatforms = async (): Promise<Platform[]> => {
    const query = `SELECT * FROM platforms ORDER BY provider_name;`;
    return runQuery<Platform>(query);
};

export const getPopularActors = async (): Promise<Actor[]> => {
    const query = `
        SELECT * FROM actors
        ORDER BY popularity DESC
        LIMIT 20;
    `;
    return runQuery<Actor>(query);
};

export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
    // This is a complex query that would require joins across multiple tables
    // (movies, genres, movie_genres, actors, movie_cast, videos etc.)
    // For now, we'll return the basic movie info and mock the rest.
    const movieQuery = 'SELECT * FROM movies WHERE id = $1;';
    const movies = await runQuery<Movie>(movieQuery, [movieId]);
    
    if (movies.length === 0) {
        throw new Error('Movie not found');
    }
    
    // Mocking additional details that would require more complex joins
    return {
        ...movies[0],
        genres: [],
        runtime: 120,
        videos: { results: [] },
        credits: { cast: [], crew: [] },
        release_dates: { results: [] },
    } as MovieDetails;
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
    if (!query) return [];
    const searchQuery = `
        SELECT * FROM movies
        WHERE title ILIKE $1
        LIMIT 20;
    `;
    return runQuery<Movie>(searchQuery, [`%${query}%`]);
}

export const discoverMovies = async ({
    recency,
    genreId,
    language,
    platformId,
    actorId,
}: {
    recency?: string,
    genreId?: string,
    language?: string,
    platformId?: string,
    actorId?: string,
}): Promise<Movie[]> => {
    let baseQuery = 'SELECT DISTINCT m.* FROM movies m';
    const joins: string[] = [];
    const wheres: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (genreId && genreId !== 'all') {
        joins.push('LEFT JOIN movie_genres mg ON m.id = mg.movie_id');
        wheres.push(`mg.genre_id = $${paramIndex++}`);
        params.push(parseInt(genreId, 10));
    }

    if (platformId && platformId !== 'all') {
        joins.push('LEFT JOIN movie_platforms mp ON m.id = mp.movie_id');
        wheres.push(`mp.platform_id = $${paramIndex++}`);
        params.push(parseInt(platformId, 10));
    }

    if (actorId && actorId !== 'all') {
        joins.push('LEFT JOIN movie_cast mc ON m.id = mc.movie_id');
        wheres.push(`mc.actor_id = $${paramIndex++}`);
        params.push(parseInt(actorId, 10));
    }

    if (language && language !== 'all') {
        wheres.push(`m.original_language = $${paramIndex++}`);
        params.push(language);
    }
    
    if (recency && recency !== 'all') {
        const today = new Date();
        let fromDate: Date;
        
        switch (recency) {
            case '6m':
                fromDate = sub(today, { months: 6 });
                wheres.push(`m.release_date >= $${paramIndex++}`);
                params.push(format(fromDate, 'yyyy-MM-dd'));
                break;
            case '1y':
                fromDate = sub(today, { years: 1 });
                wheres.push(`m.release_date >= $${paramIndex++}`);
                params.push(format(fromDate, 'yyyy-MM-dd'));
                break;
            case '5y':
                fromDate = sub(today, { years: 5 });
                wheres.push(`m.release_date >= $${paramIndex++}`);
                params.push(format(fromDate, 'yyyy-MM-dd'));
                break;
            case '5y+':
                const fiveYearsAgo = sub(today, { years: 5 });
                wheres.push(`m.release_date <= $${paramIndex++}`);
                params.push(format(fiveYearsAgo, 'yyyy-MM-dd'));
                break;
        }
    }
    
    const finalQuery = `
        ${baseQuery}
        ${joins.join('\n')}
        ${wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : ''}
        ORDER BY m.popularity DESC
        LIMIT 40;
    `;
    
    return runQuery<Movie>(finalQuery, params);
}
