import { Document, FilterQuery, Model } from 'mongoose';
import { documentExists } from '.';

export async function retrieveDocument<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
): Promise<T> {
  if (documentExists(model, filter)) {
    return model.findOne(filter).exec();
  } else {
    return undefined;
  }
}
