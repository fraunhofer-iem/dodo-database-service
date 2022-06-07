import { KpiDocument } from '../../../config/kpis/model/schemas';
import { Release } from '../../../entities/releases/model/schemas';

export type CalculationEventPayload = {
  kpi: KpiDocument;
  since: Date;
  release: Release;
  data: { [key: string]: any };
};
