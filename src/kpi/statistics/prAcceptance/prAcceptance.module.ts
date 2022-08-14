import { Module } from '@nestjs/common';
import { RepositoryModule } from '../../../entities/repositories/repository.module';
import { PrAcceptanceService } from './prAcceptance.service';

@Module({
  providers: [PrAcceptanceService],
  imports: [RepositoryModule],
  exports: [PrAcceptanceService],
  controllers: [],
})
export class PrAcceptanceModule {}
