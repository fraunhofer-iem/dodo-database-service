import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { Commit } from 'src/database/schemas/commit.schema';
import { Diff } from 'src/database/schemas/diff.schema';
import { IssueWithEvents } from 'src/database/schemas/issueWithEvents.schema';
import { Languages } from 'src/database/schemas/language.schema';
import { Releases } from 'src/database/schemas/releases.schema';

export type RepositoryDocument = Repository & Document;

@Schema()
export class Repository {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Diffs' }])
  diffs: Diff[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'IssueWithEvents' }])
  issuesWithEvents: IssueWithEvents[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Releases' }])
  releases: Releases[];

  @Prop({ type: mSchema.Types.ObjectId, ref: 'Languages' })
  languages: Languages;

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Commits' }])
  commits: Commit[];

  @Prop()
  owner: string;

  @Prop()
  repo: string;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
