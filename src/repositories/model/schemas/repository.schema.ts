import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { Commit } from '../../commits/model/schema';
import { Issue } from '../../issues/model/schemas';
import { Diff } from '../../pullRequests/model/schemas';
import { Release } from '../../releases/model/schema';

export type RepositoryDocument = Repository & Document;

/**
 * For further information, see: 
 * https://docs.github.com/en/rest/reference/repos
 */
@Schema()
export class Repository {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Diff' }])
  diffs: Diff[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Issue' }])
  issues: Issue[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Release' }])
  releases: Release[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Commit' }])
  commits: Commit[];

  @Prop()
  owner: string;

  @Prop()
  repo: string;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
