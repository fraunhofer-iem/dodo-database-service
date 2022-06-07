import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as mSchema } from 'mongoose';
import { Kpi } from '../../../../config/kpis/model/schemas';
import { Release } from '../../../../entities/releases/model/schemas';

@Schema()
export class KpiRun {
  @Prop({ type: mSchema.Types.Mixed, ref: 'Kpi' })
  kpi: Kpi;

  @Prop({ type: Object })
  value: any[] | any;

  @Prop({ type: mSchema.Types.Mixed, ref: 'Release' })
  release: Release;

  @Prop()
  since: string;

  @Prop()
  to: string;
}

export type KpiRunDocument = KpiRun & Document;

export const KpiRunSchema = SchemaFactory.createForClass(KpiRun);
