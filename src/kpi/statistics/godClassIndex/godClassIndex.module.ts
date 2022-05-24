import { Module } from '@nestjs/common';
import { GodClassIndexService } from './godClassIndex.service';

@Module({
  providers: [GodClassIndexService],
  imports: [],
  exports: [GodClassIndexService],
})
export class GodClassIndexModule {}
