import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LabelService } from './label.service';
import { Label, LabelSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeature(
      [{ name: Label.name, schema: LabelSchema }],
      'data',
    ),
  ],
  providers: [LabelService],
  exports: [LabelService],
})
export class LabelModule {}
