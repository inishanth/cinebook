export const getPosterUrl = (path: string | null, size: 'w92' | 'w500' | 'original' = 'w500') => {
  if (!path) {
    const dimensions = size === 'w92' ? '92x138' : '500x750';
    return `https://placehold.co/${dimensions}.png`;
  }
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const getBannerUrl = (path: string | null, size: 'original' | 'w1280' = 'original') => {
  if (!path) {
    return 'https://placehold.co/1280x720.png';
  }
  return `https://image.tmdb.org/t/p/${size}${path}`;
};
