export const userLookup = {
  from: 'users',
  localField: 'user',
  foreignField: '_id',
  as: 'user',
};

export const assigneeLookup = {
  from: 'users',
  localField: 'assignee',
  foreignField: '_id',
  as: 'assignee',
};

export const assigneesLookup = {
  from: 'users',
  localField: 'assignees',
  foreignField: '_id',
  as: 'assignees',
};

export const eventsLookup = {
  from: 'issueevents',
  localField: 'events',
  foreignField: '_id',
  as: 'events',
};

export const eventsActorLookup = {
  from: 'users',
  localField: 'events.actor',
  foreignField: '_id',
  as: 'events.actor',
};

export const labelsLookup = {
  from: 'labels',
  localField: 'labels',
  foreignField: '_id',
  as: 'labels',
};

export const repoLookup = {
  from: 'repositories',
  localField: 'repo',
  foreignField: '_id',
  as: 'repo',
};
