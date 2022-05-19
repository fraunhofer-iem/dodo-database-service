export interface KpiTypeCreate {
  id: string;
  name: string;
  children: string[];
  type: 'repo' | 'orga';
}
