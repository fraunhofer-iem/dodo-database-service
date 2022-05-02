import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class DodoTarget {
  @Prop()
  owner: string;

  @Prop()
  repo: string;

  @Prop()
  updatedAt?: string;
}

export type DodoTargetDocument = DodoTarget & Document;

export const DodoTargetSchema = SchemaFactory.createForClass(DodoTarget);
