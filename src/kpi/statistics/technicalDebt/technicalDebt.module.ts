import { Module } from '@nestjs/common';
import { CommitModule } from 'src/entities/commits/commit.module';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { TechnicalDebtService } from './technicalDebt.service';

@Module({
  providers: [TechnicalDebtService],
  imports: [RepositoryModule, CommitModule],
  exports: [TechnicalDebtService],
  controllers: [],
})
export class TechnicalDebtModule {}
