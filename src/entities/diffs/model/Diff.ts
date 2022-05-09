import { PullRequest } from '../../pullRequests/model/PullRequest';
import { DiffFile } from '../../diffFiles/model';
import { RepositoryFile } from '../../repositoryFiles/model';

export interface Diff {
  pullRequest: PullRequest;
  files: DiffFile[];
  repositoryFiles: RepositoryFile[];
}
