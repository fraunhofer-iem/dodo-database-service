import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

@Schema()
export class IssueEventTypes {
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

export const IssueEventTypesSchema =
  SchemaFactory.createForClass(IssueEventTypes);
