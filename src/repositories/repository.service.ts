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
    return this.createRepo(createRepoDto);
  }

  public async getRepositoryById(id: string) {
    return this.repoModel.findById(id).exec();
  }

  /**
   * Creates the specified repository if it doesn't exist.
   * If it exists it returns the id of the existing one.
   * @param repo
   * @param owner
   * @returns id
   */
  private async createRepo(repoIdent: CreateRepositoryDto): Promise<string> {
    const exists = await this.repoModel.exists({
      repo: repoIdent.repo,
      owner: repoIdent.owner,
    });

    if (exists) {
      const repoM = await this.repoModel
        .findOne({ repo: repoIdent.repo, owner: repoIdent.owner })
        .exec();

      this.logger.debug('Model already exists ' + repoM);
      return repoM._id;
    } else {
      this.logger.debug(
        `Creating new model for ${repoIdent.repo} with owner ${repoIdent.owner}`,
      );
      const repoInstance = await new this.repoModel({
        owner: repoIdent.owner,
        repo: repoIdent.repo,
      }).save();

      this.logger.debug('Instance created ' + repoInstance);
      return repoInstance._id;
    }
  }
}
