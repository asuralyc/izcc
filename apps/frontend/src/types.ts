export type UserRole = 'user' | 'admin';
export type EventStatus = 'draft' | 'published' | 'unlisted';

export interface User {
  id: string;
  account: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface IzccEvent {
  id: string;
  title: string;
  coverImageUrl: string | null;
  content: string;
  status: EventStatus;
  archivedAt: string | null;
  registrationCount: number;
  isRegistered?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  createdAt: string;
  user: Pick<User, 'id' | 'account' | 'email' | 'displayName'>;
}

