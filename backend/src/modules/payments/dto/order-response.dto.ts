import { ApiProperty } from '@nestjs/swagger';

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  razorpayOrderId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  keyId: string;

  @ApiProperty()
  registrationId: string;
}
