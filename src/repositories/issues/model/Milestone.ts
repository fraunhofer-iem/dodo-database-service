import { User } from 'src/model';

export interface Milestone {
  id: number;
  node_id: string;
  number: number;
  state: string;
  title: string;
  description: string;
  open_issues: number;
  closed_issues: number;
  created_at: string;
  updated_at: string;
  closed_at: string;
  due_on: string;
  creator: User;
}
