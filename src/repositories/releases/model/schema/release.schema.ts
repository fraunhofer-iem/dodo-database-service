import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Release {
  @Prop()
  url: string;

  @Prop()
  id: number;

  @Prop()
  node_id: string;

  @Prop()
  name: string;

  @Prop()
  created_at: string;

  @Prop()
  published_at: string;
}

export type ReleaseDocument = Release & Document;

export const ReleaseSchema = SchemaFactory.createForClass(Release);
