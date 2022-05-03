import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnyKeys, FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from '../../lib';
import { User, UserDocument } from './model/schemas';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

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

  public async create(json: AnyKeys<User>): Promise<UserDocument> {
    if (await documentExists(this.userModel, { node_id: json.node_id })) {
      throw new Error('User does already exist');
    }
    return this.userModel.create(json);
  }
}
