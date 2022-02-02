import { Aggregate, Model } from 'mongoose';
import { CommitDocument } from '../../../repositories/commits/model/schemas';
import { User } from '../../../model';
import { Commit } from '../../../repositories/commits/model';

const userLookup = (user?: User) => {
  if (user) {
    return {
      author: user,
    };
  } else {
    return {};
  }
};

export function getCommitsRetriever(
  commitModel: Model<CommitDocument>,
  user?: User,
): Aggregate<Commit[]> {
  return commitModel
    .aggregate()
    .match(userLookup(user))
    .project({ _id: 0, __v: 0 });
}
