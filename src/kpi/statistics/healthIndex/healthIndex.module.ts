import { Module } from '@nestjs/common';
import { HealthIndexService } from './healthIndex.service';

@Module({
  providers: [HealthIndexService],
  imports: [],
  exports: [HealthIndexService],
})
export class HealthIndexModule {}
