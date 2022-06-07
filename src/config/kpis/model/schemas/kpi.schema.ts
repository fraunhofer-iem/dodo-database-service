import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { KpiType } from '../../../../config/kpiTypes/model/schemas';
import { DodoTarget } from '../../../../config/targets/model/schemas';

@Schema()
export class Kpi {
  @Prop()
  id: string;

  @Prop({ type: mSchema.Types.Mixed, ref: 'KpiType' })
  kpiType: KpiType;

  @Prop({ type: mSchema.Types.Mixed, ref: 'DodoTarget' })
  target: DodoTarget;

  @Prop({ type: mSchema.Types.Mixed, ref: 'Kpi' })
  children: Kpi[];

  @Prop({ type: Object })
  params?: { [key: string]: any[] | any };
}

export type KpiDocument = Kpi & Document;

export const KpiSchema = SchemaFactory.createForClass(Kpi);
