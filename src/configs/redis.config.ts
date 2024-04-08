import { CacheOptionsFactory } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';

@Injectable()
export class RedisCacheConfig implements CacheOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  async createCacheOptions() {
    const store = await redisStore({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: +this.configService.getOrThrow<number>('REDIS_PORT'),
    });

    await new Promise((resolve, reject) => {
      store.client.on('connect', resolve);
      store.client.on('error', () => reject(new Error('Redis connection is not established.')));
    });

    return { store };
  }
}
