import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { Request } from 'express';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('razorpay')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Razorpay webhook endpoint' })
  async handleRazorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = (req as any).rawBody;

    if (!rawBody) {
      throw new Error('Raw body not available');
    }

    return this.paymentsService.handleWebhook(rawBody, signature || '');
  }
}
