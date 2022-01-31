import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RepositoryDocument } from './model/schemas';
import { CreateRepositoryDto } from './model';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  public async initializeRepository(createRepoDto: CreateRepositoryDto) {
    return this.getRepo(createRepoDto);
  }

  public async getRepositoryById(id: string) {
    return this.repoModel.findById(id).exec();
  }

  /**
   * Creates the specified repository if it doesn't exist.
   * If it exists it returns the existing one.
   */
  private async getRepo(
    repoIdent: CreateRepositoryDto,
  ): Promise<RepositoryDocument> {
    const exists = await this.repoModel.exists({
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    });

    if (exists) {
      this.logger.log(
        `Model for ${repoIdent.repo} with owner ${repoIdent.owner} already exists`,
      );
      return this.repoModel
        .findOne({ repo: repoIdent.repo, owner: repoIdent.owner })
        .exec();
    } else {
      this.logger.log(
        `Creating new model for ${repoIdent.repo} with owner ${repoIdent.owner}`,
      );
      return new this.repoModel({
        owner: repoIdent.owner,
        repo: repoIdent.repo,
      }).save();
    }
  }
}
