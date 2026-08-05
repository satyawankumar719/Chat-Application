import { z } from 'zod';

export const userSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query cannot be empty"),
});
