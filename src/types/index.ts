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

export interface Genre {
  id: number;
  name: string;
}

export interface Language {
  iso_639_1: string;
  english_name: string;
  name: string;
}

export interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
}

export interface WatchProvider {
  id: number;
  name: string;
}
