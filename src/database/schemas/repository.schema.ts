import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RepositoryDocument = Repository & Document;

@Schema()
export class Repository {
  @Prop()
  number: number;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
