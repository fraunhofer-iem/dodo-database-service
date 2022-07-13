import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { PrProcessingEfficiencyService } from './prProcessingEfficiency.service';

@Module({
  providers: [PrProcessingEfficiencyService],
  imports: [RepositoryModule],
  exports: [PrProcessingEfficiencyService],
  controllers: [],
})
export class PrProcessingEfficiencyModule {}
