import { User } from '../../../model';

export interface IssueEvent {
  id: number;
  node_id: string;
  url: string;
  event: string;
  commit_url: string;
  created_at: string;
  actor: User;
}
