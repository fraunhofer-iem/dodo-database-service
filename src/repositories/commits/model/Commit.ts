import { User } from '../../../users/model';

export interface Commit {
  url: string;
  timestamp: string;
  author: User;
  message: string;
}
