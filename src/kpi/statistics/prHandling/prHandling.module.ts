import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { PrHandlingService } from './prHandling.service';

@Module({
  providers: [PrHandlingService],
  imports: [RepositoryModule],
  exports: [PrHandlingService],
  controllers: [],
})
export class PrHandlingModule {}
