import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

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
    return this.prisma.rule.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
    });
  }

  async create(hackathonId: string, dto: CreateRuleDto, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    let order = dto.order;
    if (!order) {
      const last = await this.prisma.rule.findFirst({
        where: { hackathonId },
        orderBy: { order: 'desc' },
      });
      order = (last?.order ?? 0) + 1;
    }

    const rule = await this.prisma.rule.create({
      data: {
        hackathonId,
        title: dto.title,
        description: dto.description,
        order,
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'RULE_CREATED',
      entity: 'Rule',
      entityId: rule.id,
      metadata: { title: dto.title, order },
    });

    this.logger.log(`Rule created for hackathon ${hackathonId} by user ${userId}`);
    return rule;
  }

  async update(hackathonId: string, id: string, dto: UpdateRuleDto, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const rule = await this.prisma.rule.findFirst({
      where: { id, hackathonId },
    });
    if (!rule) throw new NotFoundException('Rule not found');

    const updated = await this.prisma.rule.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        isActive: dto.isActive,
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'RULE_UPDATED',
      entity: 'Rule',
      entityId: id,
      metadata: dto,
    });

    this.logger.log(`Rule ${id} updated for hackathon ${hackathonId}`);
    return updated;
  }

  async remove(hackathonId: string, id: string, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const rule = await this.prisma.rule.findFirst({
      where: { id, hackathonId },
    });
    if (!rule) throw new NotFoundException('Rule not found');

    await this.prisma.rule.delete({ where: { id } });

    const remaining = await this.prisma.rule.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      await this.prisma.rule.update({
        where: { id: remaining[i].id },
        data: { order: i + 1 },
      });
    }

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'RULE_DELETED',
      entity: 'Rule',
      entityId: id,
      metadata: { title: rule.title },
    });

    this.logger.log(`Rule ${id} deleted from hackathon ${hackathonId}`);
    return { message: 'Rule deleted successfully' };
  }
}
