import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { JwtConfig } from './configs/jwt.config';
import { RedisCacheConfig } from './configs/redis.config';
import { PostgresTypeOrmConfig } from './configs/typeorm.config';
import { AdminModule } from './modules/admin/admin.module';
import { ItemModule } from './modules/item/item.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { UserModule } from './modules/user/user.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({ useClass: PostgresTypeOrmConfig }),
    CacheModule.registerAsync({ isGlobal: true, useClass: RedisCacheConfig }),
    JwtModule.registerAsync({ global: true, useClass: JwtConfig }),
    UserModule,
    WorkspaceModule,
    AdminModule,
    ItemModule,
    SubscriptionModule,
    PaymentModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
