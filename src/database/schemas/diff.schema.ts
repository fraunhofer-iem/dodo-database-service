import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import {
  PullRequestFile,
  RepositoryFile,
} from 'src/github-api/model/PullRequest';
import { PullRequest } from './pullRequest.schema';

export type DiffDocument = Diff & Document;

@Schema()
export class Diff {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'PullRequestFiles' }])
  pullRequestFiles: PullRequestFile[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'RepositoryFiles' }])
  repositoryFiles: RepositoryFile[];

  @Prop({ type: mSchema.Types.ObjectId, ref: 'PullRequest' })
  pullRequest: PullRequest;
}

export const DiffSchema = SchemaFactory.createForClass(Diff);
