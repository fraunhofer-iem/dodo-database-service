import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { PrChangeRatioService } from './prChangeRatio.service';

@Module({
  providers: [PrChangeRatioService],
  imports: [RepositoryModule],
  exports: [PrChangeRatioService],
  controllers: [],
})
export class PrChangeRatioModule {}
