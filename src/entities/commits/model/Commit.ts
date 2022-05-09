import { User } from '../../users/model';

export interface Commit {
  sha: string;
  url: string;
  timestamp: string;
  author: User;
  message: string;
}
