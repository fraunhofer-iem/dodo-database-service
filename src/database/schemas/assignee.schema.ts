import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Assignee {
  @Prop()
  login: string;

  @Prop()
  id: number;

  @Prop()
  type: string;

  @Prop()
  site_admin: boolean;
}
export type AssigneeDocument = Assignee & Document;
export const AssigneeSchema = SchemaFactory.createForClass(Assignee);

