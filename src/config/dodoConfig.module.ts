import { Module } from '@nestjs/common';
import { DataExtractionModule } from './data/dataExtraction.module';
import { DodoConfigController } from './dodoConfig.controller';
import { DodoTargetModule } from './targets/dodoTarget.module';
import { DodoUserModule } from './users/dodoUser.module';

@Module({
  imports: [DodoUserModule, DodoTargetModule, DataExtractionModule],
  controllers: [DodoConfigController],
})
export class DodoConfigModule {}
