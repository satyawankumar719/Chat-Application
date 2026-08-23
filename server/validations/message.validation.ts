import { z } from 'zod';

export const chatIdParamSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
});

export const markReadSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
});
