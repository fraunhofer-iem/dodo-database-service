import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import {
  PullRequestFile,
  RepositoryFile,
} from 'src/github-api/model/PullRequest';
import { PullRequest } from './pullRequest.schema';

@Schema()
export class Diff {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'PullRequestFiles' }])
  pullRequestFiles: PullRequestFile[];

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'RepositoryFiles' }])
  repositoryFiles: RepositoryFile[];

  @Prop({ type: mSchema.Types.ObjectId, ref: 'PullRequest' })
  pullRequest: PullRequest;

  changePercentage: number;
}

export type DiffDocument = Diff & Document;

export const DiffSchema = SchemaFactory.createForClass(Diff);

DiffSchema.virtual('changePercentage').get(function (this: DiffDocument) {
  return this.pullRequestFiles.length / this.repositoryFiles.length;
});
