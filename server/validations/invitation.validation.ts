import { z } from 'zod';

export const sendInvitationSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
});

export const invitationIdParamSchema = z.object({
  id: z.string().min(1, "Invitation ID is required"),
});
