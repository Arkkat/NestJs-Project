import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtOptionsFactory } from '@nestjs/jwt';

@Injectable()
export class JwtConfig implements JwtOptionsFactory {
  constructor(private readonly configService: ConfigService) {}
  createJwtOptions() {
    return {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      signOptions: { expiresIn: '30m' },
    };
  }
}
