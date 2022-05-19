export const repoLookup = {
  from: 'repositories',
  localField: 'repo',
  foreignField: '_id',
  as: 'repo',
};

export const filesLookup = {
  from: 'repositoryfiles',
  localField: 'files',
  foreignField: '_id',
  as: 'files',
};
