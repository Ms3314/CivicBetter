import type { AuthenticatedRequest } from './index';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequest['user'];
    }
  }
}

export {};

