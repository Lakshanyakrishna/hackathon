import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { UpdatePrizeDto } from './dto/update-prize.dto';

@Injectable()
export class PrizesService {
  private readonly logger = new Logger(PrizesService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
  ) {}

  private async validateHackathonOwnership(hackathonId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the hackathon organizer can modify this resource');
      }
    }
    return hackathon;
  }

  async findAll(hackathonId: string) {
    return this.prisma.prize.findMany({
      where: { hackathonId },
      orderBy: { position: 'asc' },
      include: { winners: { include: { team: { select: { id: true, name: true } } } } },
    });
  }

  async create(hackathonId: string, dto: CreatePrizeDto, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    let position = dto.position;
    if (!position) {
      const last = await this.prisma.prize.findFirst({
        where: { hackathonId },
        orderBy: { position: 'desc' },
      });
      position = (last?.position ?? 0) + 1;
    }

    const prize = await this.prisma.prize.create({
      data: {
        hackathonId,
        position,
        title: dto.title,
        amount: dto.amount,
        description: dto.description,
      },
      include: { winners: { include: { team: { select: { id: true, name: true } } } } },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'PRIZE_CREATED',
      entity: 'Prize',
      entityId: prize.id,
      metadata: { title: dto.title, position, amount: dto.amount },
    });

    this.logger.log(`Prize created for hackathon ${hackathonId} by user ${userId}`);
    return prize;
  }

  async update(hackathonId: string, id: string, dto: UpdatePrizeDto, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const prize = await this.prisma.prize.findFirst({
      where: { id, hackathonId },
    });
    if (!prize) throw new NotFoundException('Prize not found');

    const updated = await this.prisma.prize.update({
      where: { id },
      data: {
        title: dto.title,
        amount: dto.amount,
        description: dto.description,
        isActive: dto.isActive,
      },
      include: { winners: { include: { team: { select: { id: true, name: true } } } } },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'PRIZE_UPDATED',
      entity: 'Prize',
      entityId: id,
      metadata: dto,
    });

    this.logger.log(`Prize ${id} updated for hackathon ${hackathonId}`);
    return updated;
  }

  async remove(hackathonId: string, id: string, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const prize = await this.prisma.prize.findFirst({
      where: { id, hackathonId },
    });
    if (!prize) throw new NotFoundException('Prize not found');

    await this.prisma.prize.delete({ where: { id } });

    const remaining = await this.prisma.prize.findMany({
      where: { hackathonId },
      orderBy: { position: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      await this.prisma.prize.update({
        where: { id: remaining[i].id },
        data: { position: i + 1 },
      });
    }

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'PRIZE_DELETED',
      entity: 'Prize',
      entityId: id,
      metadata: { title: prize.title, position: prize.position },
    });

    this.logger.log(`Prize ${id} deleted from hackathon ${hackathonId}`);
    return { message: 'Prize deleted successfully' };
  }
}
