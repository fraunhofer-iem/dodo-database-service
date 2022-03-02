export const issuesLookup = {
  from: 'issues',
  localField: 'issues',
  foreignField: '_id',
  as: 'issues',
};

export const issuesUserLookup = {
  from: 'users',
  localField: 'issues.user',
  foreignField: '_id',
  as: 'issues.user',
};

export const issuesAssigneeLookup = {
  from: 'users',
  localField: 'issues.assignee',
  foreignField: '_id',
  as: 'issues.assignee',
};

export const issuesAssigneesLookup = {
  from: 'users',
  localField: 'issues.assignees',
  foreignField: '_id',
  as: 'issues.assignees',
};

export const issuesEventsLookup = {
  from: 'issueevents',
  localField: 'issues.events',
  foreignField: '_id',
  as: 'issues.events',
};

export const issuesEventsActorLookup = {
  from: 'users',
  localField: 'issues.events.actor',
  foreignField: '_id',
  as: 'issues.events.actor',
};

export const issuesLabelsLookup = {
  from: 'labels',
  localField: 'issues.labels',
  foreignField: '_id',
  as: 'issues.labels',
};

export const commitsLookup = {
  from: 'commits',
  localField: 'commits',
  foreignField: '_id',
  as: 'commits',
};

export const commitsAuthorLookup = {
  from: 'users',
  localField: 'commits.author',
  foreignField: '_id',
  as: 'commits.author',
};

export const releasesLookup = {
  from: 'releases',
  localField: 'releases',
  foreignField: '_id',
  as: 'releases',
};

export const diffsLookup = {
  from: 'diffs',
  localField: 'diffs',
  foreignField: '_id',
  as: 'diffs',
};

export const diffsPullRequestLookup = {
  from: 'pullrequests',
  localField: 'diffs.pullRequest',
  foreignField: '_id',
  as: 'diffs.pullRequest',
};

export const diffsPullRequestFilesLookup = {
  from: 'pullrequestfiles',
  localField: 'diffs.pullRequestFiles',
  foreignField: '_id',
  as: 'diffs.pullRequestFiles',
};

export const diffsRepositoryFilesLookup = {
  from: 'repositoryfiles',
  localField: 'diffs.repositoryFiles',
  foreignField: '_id',
  as: 'diffs.repositoryFiles',
};
