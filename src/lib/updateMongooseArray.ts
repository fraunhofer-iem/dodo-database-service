import { AnyKeys, Document, Model } from 'mongoose';

export async function updateArray<T extends Document>(
  repoModel: Model<T>,
  repoId: string,
  push: AnyKeys<T>,
) {
  await repoModel
    .findByIdAndUpdate(repoId, {
      $push: push,
    })
    .exec();
}
