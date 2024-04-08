import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenResponse {
  @ApiProperty()
  authorization: string;
}
