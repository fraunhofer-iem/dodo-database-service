import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * For furhter information, see: https://docs.github.com/en/rest/reference/pulls#list-pull-requests-files
 */
@Schema()
export class PullRequestFile {
  @Prop()
  number: number;
  @Prop()
  sha: string;
  @Prop()
  filename: string;
  @Prop()
  status: string;
  @Prop()
  additions: number;
  @Prop()
  deletions: number;
  @Prop()
  changes: number;
  @Prop()
  blob_url: string;
  @Prop()
  raw_url: string;
  @Prop()
  contents_url: string;
  @Prop()
  patch?: string;
  @Prop()
  previous_filename?: string;
}

export type PullRequestFileDocument = PullRequestFile & Document;

export const PullRequestFileSchema =
  SchemaFactory.createForClass(PullRequestFile);
