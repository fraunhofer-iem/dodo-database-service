import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { DodoTarget } from '../../../targets/model/schemas';

@Schema()
export class DodoUser {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop([{ type: mSchema.Types.Mixed, ref: 'DodoTarget' }])
  targets: DodoTarget[];
}

export type DodoUserDocument = DodoUser & Document;

export const DodoUserSchema = SchemaFactory.createForClass(DodoUser);
