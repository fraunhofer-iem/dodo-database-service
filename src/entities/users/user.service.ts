import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyObject, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { User as UserSchema, UserDocument } from './model/schemas';
import { User } from './model';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(UserSchema.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  public async *readAll(filter: AnyObject) {
    let page: UserDocument[] = [];
    let pageNumber = 0;
    do {
      page = await this.userModel
        .aggregate()
        .project({ _id: 0, __v: 0 })
        .match(filter)
        .skip(100 * pageNumber)
        .limit(100)
        .exec();
      yield* page;
      pageNumber += 1;
    } while (page.length == 100);
  }

  public async readOrCreate(json: User): Promise<UserDocument> {
    let user: UserDocument;
    try {
      user = await this.read({ node_id: json.node_id });
    } catch {
      user = await this.create(json);
    }
    return user;
  }

  public async read(filter: FilterQuery<UserDocument>): Promise<UserDocument> {
    try {
      return retrieveDocument(this.userModel, filter);
    } catch (e) {
      throw e;
    }
  }

  public async create(json: User): Promise<UserDocument> {
    if (await documentExists(this.userModel, { node_id: json.node_id })) {
      throw new Error('User does already exist');
    }
    return this.userModel.create(json);
  }
}
