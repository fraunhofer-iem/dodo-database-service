import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GithubApiModule } from './github-api/github-api.module';
import { DatabaseModule } from './database/database.module';
import { ApiModule } from './api/api.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.prod', '.env.local'], // If a variable is found in multiple files, the first one takes precedence.
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
        auth: {
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_USER_PASSWORD'),
        },
        useNewUrlParser: true,
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    GithubApiModule,
    ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
