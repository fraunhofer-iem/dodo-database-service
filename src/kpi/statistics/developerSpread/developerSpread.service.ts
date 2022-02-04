import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommitDocument } from '../../../repositories/commits/model/schemas';
import { UserDocument } from '../../../users/model/schemas';
import { RepositoryDocument } from '../../../repositories/model/schemas';
import { getUsersRetriever } from '../lib';

@Injectable()
export class DeveloperSpreadService {
  private readonly logger = new Logger(DeveloperSpreadService.name);

  constructor(
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
    @InjectModel('Commit')
    private readonly commitModel: Model<CommitDocument>,
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  async developerSpread() {
    const users = await getUsersRetriever(this.userModel).exec();
    console.log(users);
  }
}
