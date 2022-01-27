import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Label {
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

export type LabelDocument = Label & Document;

export const LabelSchema = SchemaFactory.createForClass(Label);
