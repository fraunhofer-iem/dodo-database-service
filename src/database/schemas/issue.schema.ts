import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Labels } from './labels.schema';
import { Assignee } from './assignee.schema';
import { Assignees } from './assignees.schema';
import { Milestone } from './milestone.schema';

import { Document, Schema as mSchema } from 'mongoose';
@Schema()
export class Issue {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Labels' }])
  labels: Labels[];

  @Prop({ type: mSchema.Types.ObjectId, ref: 'Assignee' })
  assignee: Assignee;

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Assignees' }])
  assignees: Assignees[];

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

  // @Prop([{ type: mSchema.Types.ObjectId, ref: 'IssueEventTypes' }])
  // event: IssueEventTypes[];
  // TODO: create a schema for Users to fill the creator of the issue as well as the
  // assignees
}

export type IssueDocument = Issue & Document;

export const IssueSchema = SchemaFactory.createForClass(Issue);
