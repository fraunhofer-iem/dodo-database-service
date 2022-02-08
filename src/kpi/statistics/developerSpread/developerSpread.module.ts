import { Module } from '@nestjs/common';
import { DeveloperSpreadController } from './developerSpread.controller';
import { DeveloperSpreadService } from './developerSpread.service';
import { UserModule } from '../../../entities/users/user.module';
import { CommitModule } from '../../../entities/commits/commit.module';

@Module({
  providers: [DeveloperSpreadService],
  imports: [UserModule, CommitModule],
  controllers: [DeveloperSpreadController],
})
export class DeveloperSpreadModule {}
