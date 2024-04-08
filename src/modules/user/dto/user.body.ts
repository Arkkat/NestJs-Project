import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class SignInBody {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class JoinInBody {
  @ApiProperty()
  @IsNumber()
  workspaceId: number;
}

export class ReorderWorkspaceBody {
  @ApiProperty()
  @IsNumber()
  headWorkspaceUserId: number;

  @ApiProperty()
  @IsNumber()
  tailWorkspaceUserId: number;

  @ApiProperty()
  @IsNumber()
  targetWorkspaceUserId: number;
}
