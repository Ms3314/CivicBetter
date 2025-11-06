import type { Request } from 'express';

// Request types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

// Issue types
export interface Issue {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
}

export interface EditIssueRequest {
  title?: string;
  description?: string;
  status?: Issue['status'];
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// PubSub types
export interface PubSubMessage {
  type: string;
  data: unknown;
  timestamp: Date;
}

