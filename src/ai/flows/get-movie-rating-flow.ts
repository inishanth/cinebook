'use server';
/**
 * @fileOverview An AI flow to get an estimated movie rating.
 *
 * - getMovieRating - A function that returns an estimated movie rating.
 * - MovieRatingInput - The input type for the getMovieRating function.
 * - MovieRatingOutput - The return type for the getMovieRating function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MovieRatingInputSchema = z.object({
  title: z.string().describe('The title of the movie.'),
});
export type MovieRatingInput = z.infer<typeof MovieRatingInputSchema>;

const MovieRatingOutputSchema = z.object({
  rating: z
    .number()
    .describe('The estimated average rating of the movie, out of 10.'),
});
export type MovieRatingOutput = z.infer<typeof MovieRatingOutputSchema>;

export async function getMovieRating(
  input: MovieRatingInput
): Promise<MovieRatingOutput> {
  return getMovieRatingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMovieRatingPrompt',
  input: {schema: MovieRatingInputSchema},
  output: {schema: MovieRatingOutputSchema},
  prompt: `You are a movie expert. Based on your knowledge of movie ratings from various sources (like Rotten Tomatoes, IMDb, Metacritic), provide an estimated average rating for the movie "{{title}}". The rating should be a single number out of 10.`,
});

const getMovieRatingFlow = ai.defineFlow(
  {
    name: 'getMovieRatingFlow',
    inputSchema: MovieRatingInputSchema,
    outputSchema: MovieRatingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
