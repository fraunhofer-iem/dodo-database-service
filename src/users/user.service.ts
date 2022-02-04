import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { documentExists } from '../lib';
import { User as UserSchema, UserDocument } from './model/schemas';
import { User } from './model';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(UserSchema.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  public async readAll(): Promise<UserDocument[]> {
    return this.userModel.aggregate().project({ _id: 0, __v: 0 }).exec();
  }

  public async validate(json: User): Promise<UserDocument> {
    // TODO: is there a term for "look for object and create if not"?
    let user: UserDocument;
    try {
      user = await this.read({ node_id: json.node_id });
    } catch {
      user = await this.create(json);
    }
    return user;
  }

  public async read(filter: FilterQuery<UserDocument>): Promise<UserDocument> {
    if (!(await documentExists(this.userModel, filter))) {
      throw new Error('User does not exist');
    }
    return this.userModel.findOne(filter).exec();
  }

  public async create(json: User): Promise<UserDocument> {
    return this.userModel.create(json);
  }
}
