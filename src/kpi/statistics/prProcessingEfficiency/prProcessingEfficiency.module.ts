import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { ReleaseCycleModule } from '../releaseCycles/releaseCycle.module';
import { PrProcessingEfficiencyService } from './prProcessingEfficiency.service';

@Module({
  providers: [PrProcessingEfficiencyService],
  imports: [RepositoryModule, ReleaseCycleModule],
  exports: [PrProcessingEfficiencyService],
  controllers: [],
})
export class PrProcessingEfficiencyModule {}
