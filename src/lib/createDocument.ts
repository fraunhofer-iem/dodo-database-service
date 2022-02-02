import { Document, Model } from 'mongoose';

export async function createDocument<T extends Document>(
  model: Model<T>,
  json: any,
): Promise<T> {
  let document = new model(json);
  await document.save();

  return document;
}
