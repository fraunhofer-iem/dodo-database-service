import { Aggregate, Model } from 'mongoose';
import { User } from '../../../users/model';
import { UserDocument } from '../../../users/model/schemas';

export function getUsersRetriever(
  userModel: Model<UserDocument>,
): Aggregate<User[]> {
  return userModel
    .aggregate()
    .match({ type: 'User' })
    .project({ _id: 0, __v: 0 });
}
