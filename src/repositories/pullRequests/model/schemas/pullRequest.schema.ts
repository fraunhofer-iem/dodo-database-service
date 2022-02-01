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
}

export type PullRequestDocument = PullRequest & Document;

export const PullRequestSchema = SchemaFactory.createForClass(PullRequest);
