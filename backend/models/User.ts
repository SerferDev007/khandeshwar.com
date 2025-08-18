/**
 * User model for temple management system
 * Handles authentication and role-based access control
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Treasurer' | 'Viewer';
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'Admin' | 'Treasurer' | 'Viewer';
  status?: 'Active' | 'Inactive';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  role?: 'Admin' | 'Treasurer' | 'Viewer';
  status?: 'Active' | 'Inactive';
  lastLogin?: string;
}

export interface UserLoginRequest {
  username: string;
  password: string;
}

export interface UserLoginResponse {
  user: User;
  token?: string;
}