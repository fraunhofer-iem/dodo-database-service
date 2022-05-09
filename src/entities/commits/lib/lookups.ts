export const authorLookup = {
  from: 'users',
  localField: 'author',
  foreignField: '_id',
  as: 'author',
};

export const repoLookup = {
  from: 'repositories',
  localField: 'repo',
  foreignField: '_id',
  as: 'repo',
};

export const filesLookup = {
  from: 'difffiles',
  localField: 'files',
  foreignField: '_id',
  as: 'files',
};
