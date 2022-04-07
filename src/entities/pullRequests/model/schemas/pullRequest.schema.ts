import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * For further information, see: https://docs.github.com/en/rest/reference/pulls
 */
@Schema()
export class PullRequest {
  @Prop()
  id: number;

  @Prop()
  node_id: string;

  @Prop()
  number: number;

  @Prop()
  title: string;

  @Prop({ type: Object })
  base: {
    sha: string;
    ref: string;
    repo: {
      default_branch: string;
    };
  };

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

  @Prop()
  comments?: number;
}

export type PullRequestDocument = PullRequest & Document;

export const PullRequestSchema = SchemaFactory.createForClass(PullRequest);
