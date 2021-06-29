import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PullRequestDocument = PullRequest & Document;

@Schema()
export class PullRequest {
  @Prop()
  number: number;
}

export const PullRequestSchema = SchemaFactory.createForClass(PullRequest);
