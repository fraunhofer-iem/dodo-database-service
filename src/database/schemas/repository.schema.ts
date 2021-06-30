import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { Diff } from './diff.schema';

export type RepositoryDocument = Repository & Document;

@Schema()
export class Repository {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Diffs' }])
  diffs: Diff[];

  @Prop()
  owner: string;

  @Prop()
  repo: string;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
