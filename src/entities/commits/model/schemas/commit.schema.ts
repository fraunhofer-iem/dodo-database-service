import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { DiffFile } from 'src/entities/diffFiles/model/schemas';
import { Repository } from 'src/entities/repositories/model/schemas';
import { User } from '../../../users/model/schemas';

/**
 * For further information, see: https://docs.github.com/en/rest/reference/commits#list-commits
 */
@Schema()
export class Commit {
  @Prop()
  sha: string;

  @Prop()
  url: string;

  @Prop()
  timestamp: string;

  @Prop({ type: mSchema.Types.Mixed, ref: 'User' })
  author: User;

  @Prop()
  message: string;

  @Prop({ type: mSchema.Types.Mixed, ref: 'Repo' })
  repo: Repository;

  @Prop([{ type: mSchema.Types.Mixed, ref: 'DiffFile' }])
  files: DiffFile[];
}

export type CommitDocument = Commit & Document;
export const CommitSchema = SchemaFactory.createForClass(Commit);
