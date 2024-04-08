import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import path from 'path';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Injectable()
export class PostgresTypeOrmConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      logging: this.configService.getOrThrow<string>('ENV') === 'DEV' ? true : ['error'],
      type: 'postgres',
      host: this.configService.getOrThrow<string>('PG_HOST'),
      port: this.configService.getOrThrow<number>('PG_PORT'),
      username: this.configService.getOrThrow<string>('PG_USER'),
      password: this.configService.getOrThrow<string>('PG_PASSWORD'),
      database: this.configService.getOrThrow<string>('PG_DB'),
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: false,
      entities: [path.join(__dirname, '../entities/*.{t,j}s')],
      migrationsRun: true,
      migrations: [path.join(__dirname, '../migrations/*.{t,j}s')],
    };
  }
}
