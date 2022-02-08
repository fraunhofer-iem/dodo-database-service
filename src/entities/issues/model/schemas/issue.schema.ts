import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Label } from '../../../labels/model/schemas';
import { Milestone } from '../../../milestones/model/schemas';
import { Document, Schema as mSchema } from 'mongoose';
import { User } from '../../../users/model/schemas';
import { IssueEvent } from '../../../issueEvents/model/schemas';

/**
 * For further information, see: https://docs.github.com/en/rest/reference/issues#list-repository-issues
 */
@Schema()
export class Issue {
  @Prop([{ type: mSchema.Types.Mixed, ref: 'Label' }])
  labels: Label[];

  @Prop({ type: mSchema.Types.Mixed, ref: 'User', default: null })
  assignee: User;

  @Prop([{ type: mSchema.Types.Mixed, ref: 'User' }])
  assignees: User[];

  @Prop({ type: mSchema.Types.Mixed, ref: 'User' })
  user: User;

  @Prop({ type: mSchema.Types.Mixed, ref: 'Milestone' })
  milestone: Milestone;

  @Prop()
  created_at: string;

  @Prop()
  updated_at: string;

  @Prop()
  closed_at: string;

  @Prop()
  state: string;

  @Prop()
  id: number;

  @Prop()
  number: number;

  @Prop()
  node_id: string;

  @Prop()
  title: string;

  @Prop({ type: mSchema.Types.Mixed, ref: 'User', default: null })
  closed_by: User;

  @Prop()
  author_association: string;

  @Prop([{ type: mSchema.Types.Mixed, ref: 'IssueEvent' }])
  events: IssueEvent[];
}

export type IssueDocument = Issue & Document;

export const IssueSchema = SchemaFactory.createForClass(Issue);
