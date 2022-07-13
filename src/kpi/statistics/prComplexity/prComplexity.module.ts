import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { PrComplexityService } from './prComplexity.service';

@Module({
  providers: [PrComplexityService],
  imports: [RepositoryModule],
  exports: [PrComplexityService],
  controllers: [],
})
export class PrComplexityModule {}
