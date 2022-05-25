export interface KpiCreate {
  owner: string;
  repo?: string;
  type: string;
  id?: string;
  params?: any;
}

export interface Kpi {
  id: string;
  type: string;
  name: string;
  owner: string;
  repo: string;
  children: string[];
}
