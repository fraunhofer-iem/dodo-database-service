import { User } from 'src/model';
import { IssueEvent } from '.';
import { Label } from './Label';
import { Milestone } from './Milestone';

export interface Issue {
  state: string;
  labels: Partial<Label>[];
  assignee: User;
  assignees?: User[];
  milestone: Milestone;
  created_at: string;
  updated_at: string;
  closed_at: string;
  title: string;
  id: number;
  number: number;
  node_id: string;
  locked: boolean;
  events: IssueEvent[];
}
