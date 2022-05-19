import { KpiDocument } from 'src/entities/kpis/model/schemas';
import { Release } from 'src/entities/releases/model/schemas';

export type CalculationEventPayload = {
  kpi: KpiDocument;
  since: Date;
  release: Release;
  data: { [key: string]: any };
};
