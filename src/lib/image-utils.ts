'use server';

export const getPosterUrl = (path: string | null, size: 'w92' | 'w500' | 'original' = 'w500') => {
  // Assuming poster_path is a full URL now, or we use a placeholder
  return path || 'https://placehold.co/500x750.png';
};

export const getBannerUrl = (path: string | null, size: 'original' | 'w1280' = 'original') => {
  // Assuming backdrop_path is a full URL now, or we use a placeholder
  return path || 'https://placehold.co/1280x720.png';
};