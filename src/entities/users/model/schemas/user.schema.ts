import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User {
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
export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
