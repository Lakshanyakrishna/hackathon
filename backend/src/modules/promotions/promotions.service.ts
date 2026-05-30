import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
    private notificationsService: NotificationsService,
  ) {}

  async promote(
    hackathonId: string,
    stageId: string,
    userId: string,
    teamIds?: string[],
    force?: boolean,
  ) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the hackathon organizer can promote teams');
      }
    }

    const stage = await this.prisma.stageConfig.findUnique({
      where: { id: stageId },
    });
    if (!stage) throw new NotFoundException('Stage not found');
    if (stage.hackathonId !== hackathonId) {
      throw new BadRequestException('Stage does not belong to this hackathon');
    }

    const promotionRule = stage.promotionRule as any;
    if (!promotionRule || !promotionRule.type) {
      throw new BadRequestException('Stage has no promotion rule configured');
    }

    if (hackathon.status !== 'PUBLISHED' && hackathon.status !== 'ONGOING') {
      throw new BadRequestException('Hackathon must be PUBLISHED or ONGOING to promote teams');
    }

    if (stage.promotionExecuted && !force) {
      throw new BadRequestException(
        'Promotion already executed for this stage. Set force=true to re-run.',
      );
    }

    if (force && stage.promotionExecuted) {
      this.logger.warn(`Forced re-run of promotion for stage ${stageId} by user ${userId}`);
    }

    const nextStage = await this.prisma.stageConfig.findFirst({
      where: { hackathonId, order: stage.order + 1 },
    });
    if (!nextStage) {
      throw new BadRequestException('No next stage found; this is the final stage');
    }

    let promotedTeamIds: string[];

    if (promotionRule.type === 'MANUAL_SELECTION') {
      if (!teamIds || teamIds.length === 0) {
        throw new BadRequestException('teamIds is required for MANUAL_SELECTION promotion');
      }
      promotedTeamIds = teamIds;
    } else if (promotionRule.type === 'TOP_N' || promotionRule.type === 'MINIMUM_SCORE') {
      const rankings = await this.getStageRankings(stageId);
      if (rankings.length === 0) {
        throw new BadRequestException('No scored teams to evaluate for promotion');
      }

      if (promotionRule.type === 'TOP_N') {
        const topN = promotionRule.value as number;
        if (!topN || topN < 1) {
          throw new BadRequestException('Invalid TOP_N value in promotion rule');
        }
        promotedTeamIds = rankings.slice(0, topN).map((r) => r.teamId);
      } else {
        const threshold = promotionRule.value as number;
        if (!threshold || threshold <= 0 || threshold > 100) {
          throw new BadRequestException('Invalid MINIMUM_SCORE value in promotion rule (must be 1-100)');
        }
        promotedTeamIds = rankings
          .filter((r) => r.stagePercentage >= threshold)
          .map((r) => r.teamId);
      }
    } else {
      throw new BadRequestException(`Unknown promotion rule type: ${promotionRule.type}`);
    }

    if (promotedTeamIds.length === 0) {
      return { message: 'No teams qualified for promotion', promotedCount: 0 };
    }

    const teams = await this.prisma.team.findMany({
      where: { id: { in: promotedTeamIds }, hackathonId },
    });

    const validIds = new Set(teams.map((t) => t.id));
    const invalidIds = promotedTeamIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(`Invalid team IDs: ${invalidIds.join(', ')}`);
    }

    await this.prisma.team.updateMany({
      where: { id: { in: promotedTeamIds } },
      data: { promotedToStageOrder: nextStage.order },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'TEAMS_PROMOTED',
      entity: 'Stage',
      entityId: stageId,
      metadata: {
        rule: promotionRule.type,
        fromStageOrder: stage.order,
        toStageOrder: nextStage.order,
        teamIds: promotedTeamIds,
        forced: !!force,
      },
    });

    await this.prisma.stageConfig.update({
      where: { id: stageId },
      data: {
        promotionExecuted: true,
        promotedAt: new Date(),
        promotedBy: userId,
      },
    });

    for (const teamId of promotedTeamIds) {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        const members = await this.prisma.teamMember.findMany({
          where: { teamId },
          select: { userId: true },
        });
        for (const member of members) {
          await this.notificationsService.create({
            userId: member.userId,
            type: 'TEAM_PROMOTED',
            title: `Team promoted to "${nextStage.name}"`,
            message: `Your team "${team.name}" has been promoted to ${nextStage.name} in ${hackathon.title}`,
            data: { stageId, stageName: nextStage.name, teamId, hackathonId },
          });
        }
      }
    }

    this.logger.log(`Promoted ${promotedTeamIds.length} teams from stage ${stage.order} to ${nextStage.order} in hackathon ${hackathonId}`);

    return {
      message: `Promoted ${promotedTeamIds.length} teams to "${nextStage.name}"`,
      promotedCount: promotedTeamIds.length,
      rule: promotionRule.type,
      fromStage: stage.name,
      toStage: nextStage.name,
    };
  }

  async getStageLeaderboard(stageId: string, hackathonId: string) {
    const stage = await this.prisma.stageConfig.findUnique({
      where: { id: stageId },
    });
    if (!stage) throw new NotFoundException('Stage not found');
    if (stage.hackathonId !== hackathonId) {
      throw new BadRequestException('Stage does not belong to this hackathon');
    }

    return this.getStageRankings(stageId);
  }

  async getOverallLeaderboard(hackathonId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const stages = await this.prisma.stageConfig.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
    });

    if (stages.length === 0) {
      return [];
    }

    const stageRankings = await Promise.all(
      stages.map((s) => this.getStageRankings(s.id)),
    );

    const teamScoresMap = new Map<string, { teamName: string; totalPercentage: number; stageCount: number }>();

    for (const rankings of stageRankings) {
      for (const entry of rankings) {
        const existing = teamScoresMap.get(entry.teamId) || { teamName: entry.teamName, totalPercentage: 0, stageCount: 0 };
        existing.totalPercentage += entry.stagePercentage;
        existing.stageCount++;
        teamScoresMap.set(entry.teamId, existing);
      }
    }

    const leaderboard = Array.from(teamScoresMap.entries()).map(([teamId, data]) => ({
      teamId,
      teamName: data.teamName,
      overallPercentage: data.stageCount > 0
        ? Math.round((data.totalPercentage / data.stageCount) * 100) / 100
        : 0,
      stagesScored: data.stageCount,
    }));

    leaderboard.sort((a, b) => b.overallPercentage - a.overallPercentage);

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  }

  private async getStageRankings(stageId: string) {
    const stage = await this.prisma.stageConfig.findUnique({
      where: { id: stageId },
    });
    if (!stage) throw new NotFoundException('Stage not found');

    const criteria = stage.evaluationCriteria as any[];
    let stageMaxScore = 0;
    if (Array.isArray(criteria) && criteria.length > 0) {
      stageMaxScore = criteria.reduce((sum, c: any) => sum + (c.maxScore || 0), 0);
    }

    const scores = await this.prisma.score.findMany({
      where: { stageId },
      include: {
        team: { select: { id: true, name: true } },
      },
    });

    const teamScoresMap = new Map<string, { total: number; count: number; teamName: string }>();

    for (const score of scores) {
      const existing = teamScoresMap.get(score.teamId) || { total: 0, count: 0, teamName: score.team.name };
      existing.total += score.total;
      existing.count++;
      teamScoresMap.set(score.teamId, existing);
    }

    const rankings = Array.from(teamScoresMap.entries()).map(([teamId, data]) => {
      const avgScore = data.count > 0 ? data.total / data.count : 0;
      const stagePercentage = stageMaxScore > 0
        ? Math.round((avgScore / stageMaxScore) * 10000) / 100
        : 0;

      return {
        teamId,
        teamName: data.teamName,
        averageScore: Math.round(avgScore * 100) / 100,
        stageMaxScore,
        stagePercentage,
        organizerScoreCount: data.count,
      };
    });

    rankings.sort((a, b) => b.stagePercentage - a.stagePercentage);

    return rankings.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));
  }
}
