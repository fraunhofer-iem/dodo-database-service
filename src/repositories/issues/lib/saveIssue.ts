import { Model } from 'mongoose';
import { UserDocument } from '../../../model/schemas';
import { updateArray } from '../../../lib';
import { RepositoryIdentifier } from '../../model';
import { RepositoryDocument } from '../../model/schemas';
import { Issue } from '../model';
import {
  IssueDocument,
  IssueEvent,
  IssueEventDocument,
  LabelDocument,
  MilestoneDocument,
} from '../model/schemas';
import { queryIssueEvents } from './queryIssueEvents';

interface IssueModels {
  RepoModel: Model<RepositoryDocument>;
  IssueModel: Model<IssueDocument>;
  LabelModel: Model<LabelDocument>;
  AssigneeModel: Model<UserDocument>;
  MilestoneModel: Model<MilestoneDocument>;
  IssueEventModel: Model<IssueEventDocument>;
}

export async function saveIssue(
  repoIdent: RepositoryIdentifier,
  issueModels: IssueModels,
  issue: Partial<Issue>,
  repoId: string,
) {
  const {
    RepoModel,
    IssueModel,
    LabelModel,
    AssigneeModel,
    MilestoneModel,
    IssueEventModel,
  } = issueModels;

  const issueModel = new IssueModel();

  issueModel.id = issue.id;
  issueModel.number = issue.number;

  issueModel.state = issue.state;
  issueModel.node_id = issue.node_id;
  issueModel.events = [];
  issueModel.created_at = issue.created_at;
  issueModel.updated_at = issue.updated_at;
  issueModel.closed_at = issue.closed_at;
  issueModel.title = issue.title;

  issueModel.labels = await LabelModel.create(issue.labels);
  issueModel.assignee = await AssigneeModel.create(issue.assignee);
  issueModel.assignees = await AssigneeModel.create(issue.assignees);
  issueModel.milestone = await MilestoneModel.create(issue.milestone);

  const issueEvents = await getIssueEvents(repoIdent, issue.number);

  issueModel.events = await IssueEventModel.create(issueEvents);

  const savedIssue = await issueModel.save();
  await updateArray(RepoModel, repoId, {
    issues: [savedIssue],
  });

  return savedIssue.id;
}

async function getIssueEvents(
  repoIdent: RepositoryIdentifier,
  issueNumber: number,
  pageNumber = 1,
): Promise<Partial<IssueEvent>[]> {
  const events = await queryIssueEvents(repoIdent, issueNumber, pageNumber);

  if (events.length == 100) {
    return [
      ...events,
      ...(await getIssueEvents(repoIdent, issueNumber, pageNumber + 1)),
    ];
  } else {
    return events;
  }
}
