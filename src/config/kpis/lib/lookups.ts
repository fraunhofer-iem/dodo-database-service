export const targetLookup = {
  from: 'dodotargets',
  localField: 'target',
  foreignField: '_id',
  as: 'target',
};

export const kpiTypeLookup = {
  from: 'kpitypes',
  localField: 'kpiType',
  foreignField: '_id',
  as: 'kpiType',
};

export const childrenLookup = {
  from: 'kpis',
  localField: 'children',
  foreignField: '_id',
  as: 'children',
};
