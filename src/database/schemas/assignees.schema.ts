import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Assignees {
  @Prop()
  login: string;

  @Prop()
  id: number;

  @Prop()
  node_id: string;

  @Prop()
  type: string;

  @Prop()
  site_admin: boolean;
}
export type AssigneesDocument = Assignees & Document;
export const AssigneesSchema = SchemaFactory.createForClass(Assignees);
