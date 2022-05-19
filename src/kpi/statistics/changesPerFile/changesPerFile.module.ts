import { Module } from '@nestjs/common';
import { CommitModule } from 'src/entities/commits/commit.module';
import { ChangesPerFileService } from './changesPerFile.service';

@Module({
  providers: [ChangesPerFileService],
  imports: [CommitModule],
  exports: [ChangesPerFileService],
})
export class ChangesPerFileModule {}
