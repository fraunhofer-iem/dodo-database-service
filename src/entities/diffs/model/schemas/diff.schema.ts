import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { PullRequest } from '../../../pullRequests/model/schemas';
import { PullRequestFile } from '../../../pullRequestFiles/model/schemas';
import { RepositoryFile } from '../../../repositoryFiles/model/schemas';

@Schema()
export class Diff {
  @Prop([{ type: mSchema.Types.Mixed, ref: 'PullRequestFile' }])
  pullRequestFiles: PullRequestFile[];

  @Prop([{ type: mSchema.Types.Mixed, ref: 'RepositoryFile' }])
  repositoryFiles: RepositoryFile[];

  @Prop({ type: mSchema.Types.Mixed, ref: 'PullRequest' })
  pullRequest: PullRequest;

  changePercentage: number;
}

export type DiffDocument = Diff & Document;

export const DiffSchema = SchemaFactory.createForClass(Diff);

DiffSchema.virtual('changePercentage').get(function (this: DiffDocument) {
  return this.pullRequestFiles.length / this.repositoryFiles.length;
});
