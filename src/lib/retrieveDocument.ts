import { Document, FilterQuery, Model } from 'mongoose';
import { documentExists } from '.';

export async function retrieveDocument<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
): Promise<T> {
  if (!(await documentExists(model, filter))) {
    throw new Error(`No such document: ${filter}`);
  }
  return model.findOne(filter).exec();
}
