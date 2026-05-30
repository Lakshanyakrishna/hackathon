import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateWinnerDto } from './dto/create-winner.dto';

@Injectable()
export class WinnersService {
  private readonly logger = new Logger(WinnersService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(hackathonId: string, dto: CreateWinnerDto, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the hackathon organizer can declare winners');
      }
    }

    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (team.hackathonId !== hackathonId) {
      throw new BadRequestException('Team does not belong to this hackathon');
    }

    if (dto.prizeId) {
      const prize = await this.prisma.prize.findUnique({
        where: { id: dto.prizeId },
      });
      if (!prize) throw new NotFoundException('Prize not found');
      if (prize.hackathonId !== hackathonId) {
        throw new BadRequestException('Prize does not belong to this hackathon');
      }
    }

    const lastStage = await this.prisma.stageConfig.findFirst({
      where: { hackathonId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    if (lastStage && team.promotedToStageOrder < lastStage.order) {
      throw new BadRequestException(
        'Team has not completed all required promotion steps to be declared a winner',
      );
    }

    const existing = await this.prisma.winner.findUnique({
      where: {
        hackathonId_teamId_awardTitle: {
          hackathonId,
          teamId: dto.teamId,
          awardTitle: dto.awardTitle,
        },
      },
    });
    if (existing) {
      throw new BadRequestException('This team already has this award title');
    }

    const winner = await this.prisma.winner.create({
      data: {
        hackathonId,
        teamId: dto.teamId,
        awardTitle: dto.awardTitle,
        prizeId: dto.prizeId,
      },
      include: {
        team: { select: { id: true, name: true } },
        prize: { select: { id: true, title: true, amount: true } },
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'WINNER_DECLARED',
      entity: 'Winner',
      entityId: winner.id,
      metadata: { teamId: dto.teamId, awardTitle: dto.awardTitle },
    });

    this.logger.log(`Winner declared: team ${dto.teamId} - "${dto.awardTitle}"`);
    return winner;
  }

  async findAll(hackathonId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    return this.prisma.winner.findMany({
      where: { hackathonId },
      include: {
        team: { select: { id: true, name: true } },
        prize: { select: { id: true, title: true, amount: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(hackathonId: string, id: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the hackathon organizer can remove winners');
      }
    }

    const winner = await this.prisma.winner.findUnique({
      where: { id },
    });
    if (!winner) throw new NotFoundException('Winner not found');
    if (winner.hackathonId !== hackathonId) {
      throw new BadRequestException('Winner does not belong to this hackathon');
    }

    await this.prisma.winner.delete({ where: { id } });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'WINNER_REMOVED',
      entity: 'Winner',
      entityId: id,
      metadata: { teamId: winner.teamId, awardTitle: winner.awardTitle },
    });

    this.logger.log(`Winner removed: ${id}`);
    return { message: 'Winner removed' };
  }
}
