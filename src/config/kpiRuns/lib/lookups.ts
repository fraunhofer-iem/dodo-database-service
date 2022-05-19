export const kpiLookup = {
  from: 'kpis',
  localField: 'kpi',
  foreignField: '_id',
  as: 'kpi',
};

export const kpiTypeLookup = {
  from: 'kpitypes',
  localField: 'kpi.kpiType',
  foreignField: '_id',
  as: 'kpi.kpiType',
};

export const releaseLookup = {
  from: 'releases',
  localField: 'release',
  foreignField: '_id',
  as: 'release',
};
