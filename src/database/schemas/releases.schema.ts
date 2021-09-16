import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';

@Schema()
export class Releases {

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

export type ReleasesDocument = Releases & Document;

export const ReleasesSchema = SchemaFactory.createForClass(Releases);
