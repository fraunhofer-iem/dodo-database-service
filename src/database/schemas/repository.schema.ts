import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { Diff } from './diff.schema';
import { Releases } from './releases.schema';
import { IssueWithEvents } from './issueWithEvents.schema';
import { Languages } from './language.schema';

export type RepositoryDocument = Repository & Document;

@Schema()
export class Repository {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Diffs' }])
  diffs: Diff[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'IssueWithEvents' }])
  issuesWithEvents: IssueWithEvents[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'Releases' }])
  releases: Releases[];
  
  @Prop({ type: mSchema.Types.ObjectId, ref: 'Languages'})
  languages: Languages;

  @Prop()
  owner: string;

  @Prop()
  repo: string;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
