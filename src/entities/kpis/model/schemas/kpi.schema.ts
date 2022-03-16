import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class KPI {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop()
  unit: string;

  @Prop()
  params: string[];
}

export type KpiDocument = KPI & Document;

export const KpiSchema = SchemaFactory.createForClass(KPI);
