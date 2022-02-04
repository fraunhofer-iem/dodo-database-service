import { Document, Model } from 'mongoose';

export async function createDocument<T extends Document>(
  model: Model<T>,
  json: any,
): Promise<T> {
  const document = new model(json);
  await document.save();

  return document;
}
