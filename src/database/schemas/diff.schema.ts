import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { PullRequest } from './pullRequest.schema';
import { Repository } from './repository.schema';

export type DiffDocument = Diff & Document;

@Schema()
export class Diff {
  @Prop({ type: mSchema.Types.ObjectId, ref: 'Repository' })
  repository: Repository;

  @Prop({ type: mSchema.Types.ObjectId, ref: 'PullRequest' })
  pullRequest: PullRequest;
}

export const DiffSchema = SchemaFactory.createForClass(Diff);
