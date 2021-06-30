import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PullRequestFileDocument = PullRequestFile & Document;

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

export const PullRequestFileSchema =
  SchemaFactory.createForClass(PullRequestFile);
