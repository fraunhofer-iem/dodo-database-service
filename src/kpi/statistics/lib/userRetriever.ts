import { Aggregate, Model } from 'mongoose';
import { User } from '../../../model';
import { UserDocument } from '../../../model/schemas';

export function getUsersRetriever(
  userModel: Model<UserDocument>,
): Aggregate<User[]> {
  return userModel.aggregate().project({ _id: 0, __v: 0 });
}
