import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Labels {
  @Prop()
  id: number;

  @Prop()
  node_id: string;

  @Prop()
  url: string;

  @Prop()
  name: string;

  @Prop()
  color: string;

  @Prop()
  default: boolean;

  @Prop()
  description: string;
}
export type LabelsDocument = Labels & Document;
export const LabelsSchema = SchemaFactory.createForClass(Labels);
