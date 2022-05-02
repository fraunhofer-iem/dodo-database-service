import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { documentExists, retrieveDocument } from 'src/lib';
import { DodoUser, DodoUserDocument } from './model/schemas';

@Injectable()
export class DodoUserService {
  private readonly logger = new Logger(DodoUserService.name);

  constructor(
    @InjectModel(DodoUser.name) private userModel: Model<DodoUserDocument>,
  ) {}

  public async readOrCreate(json: DodoUser): Promise<DodoUserDocument> {
    let user: DodoUserDocument;
    try {
      user = await this.read({ email: json.email });
    } catch {
      user = await this.create(json);
    }
    return user;
  }

  public async readAll(
    filter: FilterQuery<DodoUserDocument> = {},
  ): Promise<DodoUserDocument[]> {
    return this.userModel.aggregate().match(filter).exec();
  }

  public async read(
    filter: FilterQuery<DodoUserDocument>,
  ): Promise<DodoUserDocument> {
    return retrieveDocument(this.userModel, filter);
  }

  public async create(json: DodoUser): Promise<DodoUserDocument> {
    if (await documentExists(this.userModel, { email: json.email })) {
      throw new Error('User does already exist');
    }
    return this.userModel.create(json);
  }
}
