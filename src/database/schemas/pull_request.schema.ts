import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema()
export class Pull_request {
  @Prop()
  url: string;

}
export type Pull_requestDocument = Pull_request & Document;

export const Pull_requestSchema = SchemaFactory.createForClass(Pull_request);
