import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, AnyKeys } from 'mongoose';
import { Language } from 'src/github-api/model/PullRequest';
import { RepositoryNameDto } from 'src/github-api/model/Repository';

import { RepositoryDocument } from './schemas/repository.schema';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectModel('Repository')
    private readonly repoModel: Model<RepositoryDocument>,
  ) {}

  // async saveLanguages(
  //   repoIdent: RepositoryNameDto,
  //   languages: Language,
  // ): Promise<Language> {
  //   const exists = await this.repoModel.exists({
  //     repo: repoIdent.repo,
  //     owner: repoIdent.owner,
  //   });
  //   if (exists) {
  //     const repoM = await this.repoModel
  //       .findOne({ repo: repoIdent.repo, owner: repoIdent.owner })
  //       .exec();
  //     const languageModel = new this.languageModel();
  //     const entryExists = await this.languageModel.exists({
  //       repo_id: repoM._id,
  //     });
  //     if (entryExists) {
  //       this.logger.debug(
  //         `languages entry for ${repoIdent.owner}/${repoIdent.repo} already exists`,
  //       );
  //       return languages;
  //     }
  //     this.logger.debug(
  //       `saving programming languages from ${repoIdent.owner}/${repoIdent.repo} to database...`,
  //     );

  //     languageModel.repo_id = repoM._id;
  //     languageModel.languages = languages;
  //     const savedLanguages = await languageModel.save();

  //     await this.updateRepo(repoM._id, { languages: savedLanguages });

  //     this.logger.debug(
  //       `stored programming languages from ${repoIdent.owner}/${repoIdent.repo} successful`,
  //     );
  //   } else {
  //     //TODO: functionality moved to new module await this.createRepo(repoIdent);
  //     this.saveLanguages(repoIdent, languages);
  //   }
  //   return languages;
  // }
}
