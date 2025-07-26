

export interface Movie {
  id: number;
  title: string;
  poster_url: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  language: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Person {
  id: number;
  name: string;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number;
  cast: string[];
  videos: {
    results: {
      key: string;
      site: string;
      type: string;
    }[];
  };
  credits: {
    cast: { name: string }[];
    crew: { name: string; job: string }[];
  };
  release_dates: {
    results: {
      iso_3166_1: string;
      release_dates: { certification: string }[];
    }[];
  };
}

export interface User {
    id: number; // This will correspond to user_id from the database
    user_id?: number;
    email: string;
    username: string;
    password?: string; // Plain text, only used for creation
    password_hash: string; // Hashed password for storage
    last_login_time?: string;
    last_login_ip?: string;
    session_token?: string;
}
