export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'SUPER_ADMIN' | 'PARTICIPANT';
  avatar?: string | null;
  bio?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
