import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { Issue } from 'src/repositories/issues/model/schemas';
import { Diff } from 'src/repositories/pullRequests/model/schemas';
import { Release } from 'src/repositories/releases/model/schema';

export type RepositoryDocument = Repository & Document;

@Schema()
export class Repository {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Diff' }])
  diffs: Diff[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Issue' }])
  issues: Issue[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Release' }])
  releases: Release[];

  // @Prop({ type: mSchema.Types.ObjectId, ref: 'Language' })
  // languages: Language[];

  // @Prop([{ type: mSchema.Types.ObjectId, ref: 'Commit' }])
  // commits: Commit[];

  @Prop()
  owner: string;

  @Prop()
  repo: string;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
