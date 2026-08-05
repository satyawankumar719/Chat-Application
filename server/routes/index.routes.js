import { Router } from 'express';
import authRoutes from './auth.routes.js';
import invitationRoutes from './invitation.routes.js';
import userRoutes from './user.routes.js';
import messageRoutes from './message.routes.js';

const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/invitation', invitationRoutes);
routes.use('/users', userRoutes);
routes.use('/messages', messageRoutes);

export default routes;