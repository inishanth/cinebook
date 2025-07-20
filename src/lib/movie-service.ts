'use server';

import { Pool } from '@neondatabase/serverless';
import type { Movie, MovieDetails } from '@/types';
import { sub, format } from 'date-fns';

let pool: Pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

const runQuery = async <T>(query: string, params: any[] = []): Promise<T[]> => {
  const dbPool = getPool();
  try {
    const { rows } = await dbPool.query(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Database Query Error:', error);
    // Return a more specific error or an empty array
    if (error instanceof Error) {
        throw new Error(`Failed to fetch data from the database. Details: ${error.message}`);
    }
    throw new Error('An unknown error occurred while fetching data.');
  } 
};

export const getTrendingMovies = async (): Promise<Movie[]> => {
    const query = `
        SELECT * FROM movies
        ORDER BY release_date DESC
        LIMIT 20;
    `;
    return runQuery<Movie>(query);
};

export const getMoviesByCategory = async (categoryId: string): Promise<Movie[]> => {
    let query = '';
    
    switch(categoryId) {
        case 'popular':
            query = 'SELECT * FROM movies ORDER BY release_date DESC LIMIT 20;';
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
             query = 'SELECT * FROM movies ORDER BY release_date DESC LIMIT 20;';
    }

    return runQuery<Movie>(query);
}

export const getMovieDetails = async (movieId: number): Promise<MovieDetails> => {
    const movieQuery = 'SELECT * FROM movies WHERE id = $1;';
    const movies = await runQuery<Movie>(movieQuery, [movieId]);
    
    if (movies.length === 0) {
        throw new Error('Movie not found');
    }
    
    // Since we only have one table, we return the movie data with empty arrays for related data.
    return {
        ...movies[0],
        genres: [],
        runtime: 120, // Mocked value
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
}: {
    recency?: string,
}): Promise<Movie[]> => {
    let baseQuery = 'SELECT * FROM movies';
    const wheres: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (recency && recency !== 'all') {
        const today = new Date();
        let fromDate: Date;
        
        switch (recency) {
            case '6m':
                fromDate = sub(today, { months: 6 });
                wheres.push(`release_date >= $${paramIndex++}`);
                params.push(format(fromDate, 'yyyy-MM-dd'));
                break;
            case '1y':
                fromDate = sub(today, { years: 1 });
                wheres.push(`release_date >= $${paramIndex++}`);
                params.push(format(fromDate, 'yyyy-MM-dd'));
                break;
            case '5y':
                fromDate = sub(today, { years: 5 });
                wheres.push(`release_date >= $${paramIndex++}`);
                params.push(format(fromDate, 'yyyy-MM-dd'));
                break;
            case '5y+':
                const fiveYearsAgo = sub(today, { years: 5 });
                wheres.push(`release_date <= $${paramIndex++}`);
                params.push(format(fiveYearsAgo, 'yyyy-MM-dd'));
                break;
        }
    }
    
    const finalQuery = `
        ${baseQuery}
        ${wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : ''}
        ORDER BY release_date DESC
        LIMIT 40;
    `;
    
    return runQuery<Movie>(finalQuery, params);
}
