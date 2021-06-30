import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GithubApiModule } from './github-api/github-api.module';
import { DatabaseModule } from './database/database.module';

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
          user: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_USER_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    GithubApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
