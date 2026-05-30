import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
    role: string;
    avatar: string | null;
    isEmailVerified: boolean;
  };
}
