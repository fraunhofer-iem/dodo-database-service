import { User } from 'src/model/schemas';

export interface Commit {
  url: string;
  timestamp: string;
  author: User;
  message: string;
}
