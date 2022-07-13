import { Module } from '@nestjs/common';
import { CommitModule } from 'src/entities/commits/commit.module';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { PrSpreadService } from './prSpread.service';

@Module({
  providers: [PrSpreadService],
  imports: [RepositoryModule, CommitModule],
  exports: [PrSpreadService],
  controllers: [],
})
export class PrSpreadModule {}
