export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Language {
    id: string; // e.g., 'en'
    name: string; // e.g., 'English'
    english_name: string;
}

export interface Platform {
    id: number;
    provider_id: number;
    provider_name: string;
    logo_path: string;
}

export interface Actor {
    id: number;
    name: string;
    profile_path: string | null;
}

export interface MovieDetails extends Movie {
  genres: { id: number; name: string }[];
  runtime: number;
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
