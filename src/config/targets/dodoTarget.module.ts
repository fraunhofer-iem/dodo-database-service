import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DodoTargetService } from './dodoTarget.service';
import { DodoTarget, DodoTargetSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: DodoTarget.name, schema: DodoTargetSchema }],
      'config',
    ),
  ],
  providers: [DodoTargetService],
  exports: [DodoTargetService],
})
export class DodoTargetModule {}
