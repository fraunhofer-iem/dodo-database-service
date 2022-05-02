import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DodoTargetModule } from '../targets/dodoTarget.module';
import { DodoTargetService } from '../targets/dodoTarget.service';
import { DodoUserService } from './dodoUser.service';
import { DodoUser, DodoUserSchema } from './model/schemas';

@Module({
  imports: [
    MongooseModule.forFeatureAsync(
      [
        {
          name: DodoUser.name,
          imports: [DodoTargetModule],
          useFactory: (targetService: DodoTargetService) => {
            const schema = DodoUserSchema;
            schema.pre<DodoUser>('validate', async function (this: DodoUser) {
              for (let i = 0; i < this.targets.length; i++) {
                console.log(this.targets[i]);
                this.targets[i] = (
                  await targetService.readOrCreate(this.targets[i])
                )._id;
              }
            });
            return schema;
          },
          inject: [DodoTargetService],
        },
      ],
      'config',
    ),
  ],
  providers: [DodoUserService],
  exports: [DodoUserService],
})
export class DodoUserModule {}
