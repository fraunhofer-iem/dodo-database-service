import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';

import { Issue } from './issue.schema';
import { IssueEventTypes } from './issueEventTypes.schema';
@Schema()
export class IssueWithEvents {
  @Prop({ type: mSchema.Types.ObjectId, ref: 'Issue' })
  issue: Issue;

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'IssueEventTypes' }])
  issueEventTypes: IssueEventTypes[];

}

export type IssueWithEventsDocument = IssueWithEvents & Document;

export const IssueWithEventsSchema = SchemaFactory.createForClass(IssueWithEvents);


