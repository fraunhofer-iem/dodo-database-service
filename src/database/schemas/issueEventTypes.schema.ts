import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Assignee } from './assignee.schema';

import { Document, Schema as mSchema } from 'mongoose';

@Schema()
export class IssueEventTypes {

  @Prop({ type: mSchema.Types.ObjectId, ref: 'Assignee' })
  assignee: Assignee;

  @Prop()
  id: number;

  @Prop()
  node_id: string;
  
  @Prop()
  url: string;

  @Prop()
  event: string;

  @Prop()
  commit_url: string;

  @Prop()
  created_at: string;
}

export type IssueEventTypesDocument = IssueEventTypes & Document;

export const IssueEventTypesSchema = SchemaFactory.createForClass(IssueEventTypes);
