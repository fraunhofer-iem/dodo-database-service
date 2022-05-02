import { Module } from '@nestjs/common';
import { DodoConfigController } from './dodoConfig.controller';
import { DodoTargetModule } from './targets/dodoTarget.module';
import { DodoUserModule } from './users/dodoUser.module';

@Module({
  imports: [DodoUserModule, DodoTargetModule],
  controllers: [DodoConfigController],
})
export class DodoConfigModule {}
