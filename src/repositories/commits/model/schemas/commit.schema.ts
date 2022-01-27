import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { User } from '../../../../model/schemas';

/**
 * For further information, see: https://docs.github.com/en/rest/reference/commits#list-commits
 */
@Schema()
export class Commit {
  @Prop()
  url: string;

  @Prop()
  timestamp: string;

  @Prop([{ type: mSchema.Types.ObjectId, ref: 'User' }])
  author: User;

  @Prop()
  message: string;
}

export type CommitDocument = Commit & Document;
export const CommitSchema = SchemaFactory.createForClass(Commit);
