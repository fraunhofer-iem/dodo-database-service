import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * For further information, see: https://docs.github.com/en/rest/reference/pulls
 */
@Schema()
export class PullRequest {
  @Prop()
  number: number;

  @Prop()
  title: string;

  @Prop()
  url: string;

  @Prop()
  created_at: string;

  @Prop()
  updated_at: string;

  @Prop()
  closed_at: string;

  @Prop()
  merged_at: string;
}

export type PullRequestDocument = PullRequest & Document;

export const PullRequestSchema = SchemaFactory.createForClass(PullRequest);
