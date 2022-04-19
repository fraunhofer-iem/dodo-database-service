import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// type Data = {
//   [year: number]: { [interval: number]: { [key: string]: any[] } };
// };

@Schema()
export class KPI {
  @Prop()
  id: string;

  @Prop()
  value: number;

  // @Prop({type: () => Data})
  // data: Data;

  @Prop()
  owner: string;

  @Prop()
  repo?: string;

  @Prop()
  interval: string;

  @Prop()
  since?: string;

  @Prop()
  to: string;

  @Prop()
  updatedAt: string;

  @Prop()
  labelFilter?: string[];

  @Prop()
  fileFilter?: string[];

  @Prop()
  couplingSize?: number;

  @Prop()
  occurences?: number;

  @Prop()
  timeToComplete?: number;
}

export type KpiDocument = KPI & Document;

export const KpiSchema = SchemaFactory.createForClass(KPI);
