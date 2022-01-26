import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Schema as mSchema } from 'mongoose';
import { User } from 'src/model';

@Schema()
export class IssueEvent {
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

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'User' }])
  actor: User;
}

export type IssueEventDocument = IssueEvent & Document;

export const IssueEventSchema = SchemaFactory.createForClass(IssueEvent);
