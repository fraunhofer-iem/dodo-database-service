import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RepositoryModule } from './entities/repositories/repository.module';
import { OrganizationModule } from './entities/organizations/organization.module';
import { KPI, KpiSchema } from './entities/kpis/model/schemas';
import { KpiModule } from './kpi/kpi.module';
import { DodoConfigModule } from './config/dodoConfig.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.prod', '.env.local'], // If a variable is found in multiple files, the first one takes precedence.
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('CONFIG_URI'),
        auth: {
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_USER_PASSWORD'),
        },
        useNewUrlParser: true,
      }),
      connectionName: 'config',
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATA_URI'),
        auth: {
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_USER_PASSWORD'),
        },
        useNewUrlParser: true,
      }),
      connectionName: 'data',
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('LAKE_URI'),
        auth: {
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_USER_PASSWORD'),
        },
        useNewUrlParser: true,
      }),
      connectionName: 'lake',
      inject: [ConfigService],
    }),
    DodoConfigModule,
    // RepositoryModule,
    // KpiModule,
    // OrganizationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
