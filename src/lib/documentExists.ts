import { Document, FilterQuery, Model } from 'mongoose';

export async function documentExists<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
) {
  return await model.exists(filter);
}
