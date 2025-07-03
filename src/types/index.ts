export interface Movie {
  id: number;
  title: string;
  posterUrl: string;
  bannerUrl: string;
  'data-ai-hint': string;
  summary: string;
  trailerUrl: string;
  ratings: {
    imdb: number;
    rottenTomatoes: number;
    metacritic: number;
  };
  platforms: ('netflix' | 'hulu' | 'prime-video')[];
  category: string;
}
