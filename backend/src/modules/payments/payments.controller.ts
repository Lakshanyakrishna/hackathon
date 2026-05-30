import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-order')
  @ApiOperation({ summary: 'Create a Razorpay order for registration payment' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createOrder(dto.registrationId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments (user/organizer scoped)' })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.paymentsService.findAll(userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.paymentsService.findById(id, userId, userRole);
  }
}
