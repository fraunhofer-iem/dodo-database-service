import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * For further information, see: https://docs.github.com/en/rest/reference/repos#get-repository-content
 */
@Schema()
export class RepositoryFile {
  @Prop()
  mode: string;
  @Prop()
  path: string;
  @Prop()
  type: string;
  @Prop()
  sha: string;
  @Prop()
  size: number;
  @Prop()
  url: string;
}
export type RepositoryFileDocument = RepositoryFile & Document;
export const RepositoryFileSchema =
  SchemaFactory.createForClass(RepositoryFile);
