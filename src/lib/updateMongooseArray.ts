import { AnyKeys, Document, Model } from 'mongoose';

export async function updateArray<T extends Document>(
  model: Model<T>,
  id: string,
  push: AnyKeys<T>,
) {
  await model
    .findByIdAndUpdate(id, {
      $push: push,
    })
    .exec();
}
