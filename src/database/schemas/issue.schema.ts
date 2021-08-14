import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Issue {
  @Prop([String])
  labels: string[];

  @Prop()
  state: string;

  @Prop()
  issueId: number;

  @Prop()
  title: string;

  // TODO: create a schema for Users to fill the creator of the issue as well as the
  // assignees
}

export type IssueDocument = Issue & Document;

export const IssueSchema = SchemaFactory.createForClass(Issue);
