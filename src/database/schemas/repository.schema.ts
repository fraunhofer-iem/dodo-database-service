import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { Diff } from './diff.schema';
import { Issue } from './issue.schema';

export type RepositoryDocument = Repository & Document;

@Schema()
export class Repository {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Diffs' }])
  diffs: Diff[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Issues' }])
  issues: Issue[];

  @Prop()
  owner: string;

  @Prop()
  repo: string;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
