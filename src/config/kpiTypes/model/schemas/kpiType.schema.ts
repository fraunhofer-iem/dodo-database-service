import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';

@Schema()
export class KpiType {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop([{ type: mSchema.Types.Mixed }])
  children: KpiType[];

  @Prop()
  type: 'repo' | 'orga';
}

export type KpiTypeDocument = KpiType & Document;

export const KpiTypeSchema = SchemaFactory.createForClass(KpiType);
