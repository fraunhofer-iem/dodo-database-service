import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { PullRequest } from './pullRequest.schema';
import { PullRequestFile } from './pullRequestFile.schema';
import { RepositoryFile } from 'src/entities/repositoryFiles/model/schemas';

@Schema()
export class Diff {
  @Prop([{ type: mSchema.Types.ObjectId, ref: 'PullRequestFile' }])
  pullRequestFiles: PullRequestFile[];

  @Prop([{ type: mSchema.Types.Mixed, ref: 'RepositoryFile' }])
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
