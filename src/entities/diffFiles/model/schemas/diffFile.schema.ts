import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * For further information, see: https://docs.github.com/en/rest/reference/pulls#list-pull-requests-files
 */
@Schema()
export class DiffFile {
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

export type DiffFileDocument = DiffFile & Document;

export const DiffFileSchema = SchemaFactory.createForClass(DiffFile);
