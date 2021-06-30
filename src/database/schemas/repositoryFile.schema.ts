import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RepositoryFileDocument = RepositoryFile & Document;

@Schema()
export class RepositoryFile {
  @Prop()
  mode?: string;
  @Prop()
  path?: string;
  @Prop()
  type?: string;
  @Prop()
  sha?: string;
  @Prop()
  size?: number;
  @Prop()
  url?: string;
}

export const RepositoryFileSchema =
  SchemaFactory.createForClass(RepositoryFile);
