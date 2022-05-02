import { Module } from '@nestjs/common';
import { CommitModule } from 'src/entities/commits/commit.module';
import { DiffModule } from 'src/entities/diffs/diff.module';
import { IssueModule } from 'src/entities/issues/issue.module';
import { ReleaseModule } from 'src/entities/releases/release.module';
import { RepositoryModule } from 'src/entities/repositories/repository.module';
import { DodoTargetModule } from '../targets/dodoTarget.module';
import { DodoUserModule } from '../users/dodoUser.module';
import { DataExtractionController } from './dataExtraction.controller';
import { DataExtractionService } from './dataExtraction.service';

@Module({
  imports: [
    DodoUserModule,
    RepositoryModule,
    IssueModule,
    CommitModule,
    ReleaseModule,
    DiffModule,
  ],
  providers: [DataExtractionService],
  controllers: [DataExtractionController],
})
export class DataExtractionModule {}
