import { Module } from '@nestjs/common';
import { CommitModule } from '../../../entities/commits/commit.module';
import { ActiveCodeService } from './activeCode.service';

@Module({
  providers: [ActiveCodeService],
  imports: [CommitModule],
  exports: [ActiveCodeService],
})
export class ActiveCodeModule {}
