import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';

@Injectable()
export class ScoresService {
  private readonly logger = new Logger(ScoresService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async create(dto: CreateScoreDto, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId },
    });
    if (!team) throw new NotFoundException('Team not found');

    const hackathonId = team.hackathonId;
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Only the hackathon organizer can score teams',
        );
      }
    }

    if (dto.stageId) {
      const stage = await this.prisma.stageConfig.findUnique({
        where: { id: dto.stageId },
      });

      if (!stage) throw new NotFoundException('Stage not found');
      if (stage.hackathonId !== hackathonId) {
        throw new BadRequestException('Stage does not belong to this hackathon');
      }

      const submission = await this.prisma.submission.findFirst({
        where: {
          teamId: dto.teamId,
          stageId: dto.stageId,
          status: 'SUBMITTED',
        },
        orderBy: { version: 'desc' },
      });

      if (!submission) {
        throw new BadRequestException(
          'Team has no submitted submission for this stage',
        );
      }

      const criteria = stage.evaluationCriteria as any[];
      if (Array.isArray(criteria) && criteria.length > 0) {
        for (const c of criteria) {
          const score = dto.criteriaScores?.[c.name];
          if (score === undefined || score === null) {
            throw new BadRequestException(
              `Missing score for criterion "${c.name}"`,
            );
          }
          if (typeof score !== 'number' || score < 0 || score > c.maxScore) {
            throw new BadRequestException(
              `Score for "${c.name}" must be between 0 and ${c.maxScore}`,
            );
          }
        }
      }
    }

    let existing;

    if (dto.stageId) {
      existing = await this.prisma.score.findUnique({
        where: {
          organizerId_teamId_stageId: {
            organizerId: userId,
            teamId: dto.teamId,
            stageId: dto.stageId,
          },
        },
      });
    } else {
      existing = await this.prisma.score.findFirst({
        where: {
          organizerId: userId,
          teamId: dto.teamId,
          stageId: null,
        },
      });
    }

    if (existing) {
      throw new BadRequestException(
        'You have already scored this team. Use PUT to update.',
      );
    }

    const score = await this.prisma.score.create({
      data: {
        organizerId: userId,
        teamId: dto.teamId,
        stageId: dto.stageId,
        criteriaScores: dto.criteriaScores as any,
        total: dto.total,
        comment: dto.comment,
      },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        stage: {
          select: {
            id: true, name: true, order: true,
            evaluationCriteria: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'SCORE_ADDED',
      entity: 'Score',
      entityId: score.id,
      metadata: { teamId: dto.teamId, stageId: dto.stageId, total: dto.total },
    });

    this.logger.log(`Score created for team ${dto.teamId} by organizer ${userId}`);
    return score;
  }

  async update(id: string, dto: UpdateScoreDto, userId: string) {
    const score = await this.prisma.score.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true } },
      },
    });

    if (!score) throw new NotFoundException('Score not found');

    if (score.organizer.id !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('You can only update your own scores');
      }
    }

    const updated = await this.prisma.score.update({
      where: { id },
      data: {
        criteriaScores: dto.criteriaScores as any,
        total: dto.total,
        comment: dto.comment,
      },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        stage: {
          select: {
            id: true, name: true, order: true,
            evaluationCriteria: true,
          },
        },
      },
    });

    this.logger.log(`Score ${id} updated`);
    return updated;
  }

  async findAll(userId: string, userRole: string, filters: {
    hackathonId?: string;
    teamId?: string;
    stageId?: string;
  }) {
    const where: any = {};

    if (filters.hackathonId) where.hackathonId = filters.hackathonId;
    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.stageId) where.stageId = filters.stageId;

    if (userRole === 'ORGANIZER') {
      const hackathons = await this.prisma.hackathon.findMany({
        where: { organizerId: userId },
        select: { id: true },
      });
      where.hackathonId = { in: hackathons.map((h) => h.id) };
    } else if (userRole === 'PARTICIPANT') {
      const teams = await this.prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      });
      where.teamId = { in: teams.map((t) => t.teamId) };
    }

    return this.prisma.score.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        stage: {
          select: {
            id: true, name: true, order: true,
            evaluationCriteria: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const score = await this.prisma.score.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        team: {
          select: {
            id: true, name: true,
            members: { select: { userId: true } },
          },
        },
        stage: {
          select: {
            id: true, name: true, order: true,
            evaluationCriteria: true,
          },
        },
      },
    });

    if (!score) throw new NotFoundException('Score not found');

    const isOrganizer = score.organizer.id === userId;
    const isTeamMember = score.team?.members?.some((m: any) => m.userId === userId);
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    if (!isOrganizer && !isTeamMember && !isSuperAdmin) {
      throw new NotFoundException('Score not found');
    }

    return score;
  }

  async getStageScores(stageId: string, userId: string, userRole: string) {
    const stage = await this.prisma.stageConfig.findUnique({
      where: { id: stageId },
    });

    if (!stage) throw new NotFoundException('Stage not found');

    if (userRole === 'ORGANIZER') {
      const hackathon = await this.prisma.hackathon.findUnique({
        where: { id: stage.hackathonId },
      });
      if (hackathon?.organizerId !== userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user?.role !== 'SUPER_ADMIN') {
          throw new ForbiddenException('Not authorized to view scores for this stage');
        }
      }
    }

    return this.prisma.score.findMany({
      where: { stageId },
      include: {
        organizer: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { total: 'desc' },
    });
  }
}
