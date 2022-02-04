import { User } from '../../../users/model';
import { IssueEvent } from '../../../issueEvents/model';
import { Label } from '../../../labels/model';
import { Milestone } from '../../../milestones/model';

export interface Issue {
  state: string;
  labels: Partial<Label>[];
  user: User;
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
