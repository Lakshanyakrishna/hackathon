import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/client';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { OrderResponseDto } from './dto/order-response.dto';

const PENDING_ORDER_TTL_MS = 15 * 60 * 1000;

function toPaise(amount: number | Prisma.Decimal): number {
  if (amount instanceof Prisma.Decimal) {
    return amount.times(100).toNumber();
  }
  return Math.round(amount * 100);
}

function toDecimal(value: number | Prisma.Decimal): Prisma.Decimal {
  if (value instanceof Prisma.Decimal) {
    return value;
  }
  return new Prisma.Decimal(value);
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
    private notificationsService: NotificationsService,
    private configService: ConfigService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || '',
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || '',
    });
  }

  async createOrder(registrationId: string, userId: string): Promise<OrderResponseDto> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        hackathon: true,
        payment: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.userId !== userId) {
      throw new BadRequestException('This registration does not belong to you');
    }

    if (registration.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        `Registration is ${registration.status}. Expected PENDING_PAYMENT.`,
      );
    }

    if (registration.hackathon.registrationFee.toNumber() <= 0) {
      throw new BadRequestException('This hackathon is free. No payment required.');
    }

    if (registration.payment) {
      const existingPayment = registration.payment;

      if (existingPayment.status === 'SUCCESS') {
        throw new BadRequestException('Payment already completed for this registration');
      }

      const isRecent = Date.now() - existingPayment.createdAt.getTime() < PENDING_ORDER_TTL_MS;

      if (existingPayment.status === 'PENDING' && isRecent) {
        const amount = existingPayment.amount instanceof Prisma.Decimal
          ? existingPayment.amount.toNumber()
          : existingPayment.amount;

        return {
          id: existingPayment.id,
          razorpayOrderId: existingPayment.razorpayOrderId,
          amount: toPaise(existingPayment.amount),
          currency: existingPayment.currency,
          keyId: this.configService.get('RAZORPAY_KEY_ID') || '',
          registrationId: registration.id,
        };
      }

      if (existingPayment.status === 'PENDING' && !isRecent) {
        await this.prisma.payment.update({
          where: { id: existingPayment.id },
          data: { status: 'FAILED' },
        });
      }
    }

    const fee = registration.hackathon.registrationFee;
    const paise = toPaise(fee);
    const currency = 'INR';
    const receipt = `rcpt_${registration.id.slice(0, 12)}_${Date.now()}`;

    let razorpayOrder: any;
    try {
      razorpayOrder = await this.razorpay.orders.create({
        amount: paise,
        currency,
        receipt,
        notes: {
          registrationId: registration.id,
          hackathonId: registration.hackathonId,
          userId,
        },
      });
    } catch (error) {
      this.logger.error(`Razorpay order creation failed: ${error.message}`);
      throw new BadRequestException('Payment service unavailable. Please try again.');
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        hackathonId: registration.hackathonId,
        registrationId: registration.id,
        amount: toDecimal(fee),
        currency,
        razorpayOrderId: razorpayOrder.id,
        status: 'PENDING',
      },
    });

    const storedAmount = payment.amount instanceof Prisma.Decimal
      ? payment.amount.toNumber()
      : payment.amount;

    await this.activityLogsService.log({
      userId,
      hackathonId: registration.hackathonId,
      action: 'PAYMENT_ORDER_CREATED',
      entity: 'Payment',
      entityId: payment.id,
      metadata: {
        razorpayOrderId: razorpayOrder.id,
        amount: storedAmount,
      },
    });

    this.logger.log(`Payment order created: ${razorpayOrder.id} for registration ${registrationId}`);

    return {
      id: payment.id,
      razorpayOrderId: razorpayOrder.id,
      amount: paise,
      currency,
      keyId: this.configService.get('RAZORPAY_KEY_ID') || '',
      registrationId: registration.id,
    };
  }

  async handleWebhook(rawBody: string, signature: string): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('RAZORPAY_WEBHOOK_SECRET not configured');
      throw new BadRequestException('Webhook not configured');
    }

    if (!this.verifySignature(rawBody, signature, webhookSecret)) {
      this.logger.warn('Invalid webhook signature received');
      throw new BadRequestException('Invalid signature');
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Invalid webhook payload');
    }

    const eventName = event.event;
    const razorpayEventId = event.id;

    if (razorpayEventId) {
      const alreadyProcessed = await this.prisma.webhookEvent.findUnique({
        where: { razorpayEventId },
      });

      if (alreadyProcessed) {
        this.logger.log(`Duplicate webhook event ${razorpayEventId} skipped`);
        return { received: true };
      }
    }

    const paymentEntity = event.payload?.payment?.entity;

    if (!paymentEntity || !paymentEntity.id) {
      this.logger.warn(`Webhook missing payment entity: ${eventName}`);
      return { received: true };
    }

    const razorpayPaymentId = paymentEntity.id;
    const razorpayOrderId = paymentEntity.order_id;

    switch (eventName) {
      case 'payment.captured':
        await this.handlePaymentCaptured(razorpayPaymentId, razorpayOrderId, paymentEntity);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(razorpayPaymentId, razorpayOrderId, paymentEntity);
        break;
      case 'payment.refunded':
        await this.handlePaymentRefunded(razorpayPaymentId, razorpayOrderId, paymentEntity);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${eventName}`);
    }

    if (razorpayEventId) {
      await this.prisma.webhookEvent.create({
        data: {
          razorpayEventId,
          eventName,
          paymentId: razorpayPaymentId,
          orderId: razorpayOrderId,
        },
      }).catch((err) => {
        this.logger.warn(`Failed to record webhook event ${razorpayEventId}: ${err.message}`);
      });
    }

    return { received: true };
  }

  private async handlePaymentCaptured(
    razorpayPaymentId: string,
    razorpayOrderId: string,
    paymentEntity: any,
  ) {
    const existing = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId },
    });

    if (existing && existing.status === 'SUCCESS') {
      this.logger.log(`Duplicate webhook: payment ${razorpayPaymentId} already processed`);
      return;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: {
        registration: {
          include: { hackathon: true },
        },
      },
    });

    if (!payment) {
      this.logger.warn(`Order not found: ${razorpayOrderId}`);
      return;
    }

    const expectedPaise = toPaise(payment.amount);
    const capturedPaise = paymentEntity.amount;

    if (capturedPaise !== expectedPaise) {
      this.logger.error(
        `Amount mismatch for ${razorpayPaymentId}: expected ${expectedPaise}, got ${capturedPaise}`,
      );
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      if (payment.registration) {
        const newStatus =
          payment.registration.hackathon.registrationMode === 'APPROVAL_REQUIRED'
            ? 'PENDING_APPROVAL'
            : 'APPROVED';

        await tx.registration.update({
          where: { id: payment.registration.id },
          data: { status: newStatus },
        });
      }
    });

    const amountNum = payment.amount instanceof Prisma.Decimal
      ? payment.amount.toNumber()
      : payment.amount;

    await this.activityLogsService.log({
      userId: payment.userId,
      hackathonId: payment.hackathonId,
      action: 'PAYMENT_CAPTURED',
      entity: 'Payment',
      entityId: payment.id,
      metadata: { razorpayPaymentId, razorpayOrderId },
    });

    if (payment.registration) {
      const statusLabel =
        payment.registration.hackathon.registrationMode === 'APPROVAL_REQUIRED'
          ? 'pending approval'
          : 'approved';

      await this.notificationsService.create({
        userId: payment.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: `Your payment of ₹${amountNum.toFixed(2)} for "${payment.registration.hackathon.title}" was successful. Registration is ${statusLabel}.`,
        data: {
          hackathonId: payment.hackathonId,
          registrationId: payment.registration.id,
          paymentId: payment.id,
        },
      });
    }

    this.logger.log(`Payment captured: ${razorpayPaymentId} for order ${razorpayOrderId}`);
  }

  private async handlePaymentFailed(
    razorpayPaymentId: string,
    razorpayOrderId: string,
    _paymentEntity: any,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId },
    });

    if (!payment) {
      this.logger.warn(`Order not found for failed payment: ${razorpayOrderId}`);
      return;
    }

    if (payment.status === 'FAILED' || payment.status === 'SUCCESS') {
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId,
        status: 'FAILED',
      },
    });

    await this.activityLogsService.log({
      userId: payment.userId,
      hackathonId: payment.hackathonId,
      action: 'PAYMENT_FAILED',
      entity: 'Payment',
      entityId: payment.id,
      metadata: { razorpayPaymentId, razorpayOrderId },
    });

    this.logger.log(`Payment failed: ${razorpayPaymentId}`);
  }

  private async handlePaymentRefunded(
    razorpayPaymentId: string,
    razorpayOrderId: string,
    _paymentEntity: any,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId },
      include: { registration: true },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for refund: ${razorpayPaymentId}`);
      return;
    }

    if (payment.status === 'REFUNDED') {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      });

      if (payment.registration) {
        await tx.registration.update({
          where: { id: payment.registration.id },
          data: { status: 'CANCELLED' },
        });
      }
    });

    await this.activityLogsService.log({
      userId: payment.userId,
      hackathonId: payment.hackathonId,
      action: 'PAYMENT_REFUNDED',
      entity: 'Payment',
      entityId: payment.id,
      metadata: { razorpayPaymentId, razorpayOrderId },
    });

    this.logger.log(`Payment refunded: ${razorpayPaymentId}`);
  }

  verifySignature(rawBody: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }

  async findAll(userId: string, userRole: string) {
    const where: any = {};

    if (userRole === 'PARTICIPANT') {
      where.userId = userId;
    } else if (userRole === 'ORGANIZER') {
      const hackathons = await this.prisma.hackathon.findMany({
        where: { organizerId: userId },
        select: { id: true },
      });
      where.hackathonId = { in: hackathons.map((h) => h.id) };
    }

    const data = await this.prisma.payment.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        hackathon: {
          select: { id: true, title: true, slug: true },
        },
        registration: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return data;
  }

  async findById(id: string, userId: string, userRole: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        hackathon: {
          select: { id: true, title: true, slug: true, organizerId: true },
        },
        registration: {
          select: { id: true, status: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const isOwner = payment.userId === userId;
    const isHackathonOwner = payment.hackathon.organizerId === userId;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    if (!isOwner && !isHackathonOwner && !isSuperAdmin) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  getStatus() {
    return { message: 'Payments module ready' };
  }
}
