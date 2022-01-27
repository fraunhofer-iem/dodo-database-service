import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Label } from './label.schema';
import { Milestone } from './milestone.schema';

import { Document, Schema as mSchema } from 'mongoose';
import { User } from '../../../../model/schemas';
import { IssueEvent } from './issueEvent.schema';
@Schema()
export class Issue {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Label' }])
  labels: Label[];

  @Prop({ type: mSchema.Types.ObjectId, ref: 'User' })
  assignee: User;

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'User' }])
  assignees: User[];

  @Prop({ type: mSchema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ type: mSchema.Types.ObjectId, ref: 'Milestone' })
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

  @Prop({ type: mSchema.Types.ObjectId, ref: 'User' })
  closed_by: User;

  @Prop()
  author_association: string;

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'IssueEvent' }])
  events: IssueEvent[];
}

export type IssueDocument = Issue & Document;

export const IssueSchema = SchemaFactory.createForClass(Issue);
