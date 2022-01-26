import { AnyKeys, Model } from 'mongoose';
import { RepositoryDocument } from '../model/schemas';

export async function updateRepo(
  repoModel: Model<RepositoryDocument>,
  repoId: string,
  push: AnyKeys<RepositoryDocument>,
) {
  await repoModel
    .findByIdAndUpdate(repoId, {
      $push: push,
    })
    .exec();
}
