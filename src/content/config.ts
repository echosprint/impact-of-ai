import { defineCollection, z } from 'astro:content';

const chapters = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    publishDate: z.date().optional(),
    chapter: z.number(),
    route: z.string().optional(),
  }),
});

export const collections = {
  chapters,
}; 