import { UserController } from '../controllers/user.controller';

/**
 * User Routes (Admin only)
 */
export const userRoutes = {
  '/users': {
    GET: UserController.listUsers,
  },
  '/users/:id': {
    GET: UserController.reviewUser,
    PUT: UserController.updateUser,
  },
};

