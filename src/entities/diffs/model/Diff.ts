import { PullRequest } from '../../pullRequests/model/PullRequest';
import { PullRequestFile } from '../../pullRequestFiles/model';
import { RepositoryFile } from '../../repositoryFiles/model';

export interface Diff {
  pullRequest: PullRequest;
  pullRequestFiles: PullRequestFile[];
  repositoryFiles: RepositoryFile[];
}
