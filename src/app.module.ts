import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositoryModule } from './entities/repositories/repository.module';
import { KpiModule } from './kpi/kpi.module';
import { OrganizationModule } from './entities/organizations/organization.module';
import { DeveloperSpreadModule } from './kpi/statistics/developerSpread/developerSpread.module';

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
    RepositoryModule,
    KpiModule,
    OrganizationModule,
    DeveloperSpreadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
