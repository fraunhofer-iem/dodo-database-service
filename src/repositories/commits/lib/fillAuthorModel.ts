import { Model } from 'mongoose';
import { UserDocument } from '../../../model/schemas';
import { Commit } from '../model';

export async function fillAuthorModel(
  commits: Commit[],
  userModel: Model<UserDocument>,
) {
  const filledCommits: Commit[] = [];
  for (const commit of commits) {
    const author = await userModel.create(commit.author);
    filledCommits.push({ ...commit, author: author });
  }

  return filledCommits;
}
