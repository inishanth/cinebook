
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
  director: string | null;
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
