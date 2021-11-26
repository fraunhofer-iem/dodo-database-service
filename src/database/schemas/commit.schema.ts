import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Commit {
  @Prop()
  url: string;

  @Prop()
  login: string;

  @Prop()
  timestamp: string;
}

export type CommitDocument = Commit & Document;
export const CommitSchema = SchemaFactory.createForClass(Commit);
