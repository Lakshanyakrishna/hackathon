import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';

const SUPPORTED_FIELD_TYPES = ['text', 'textarea', 'url', 'number', 'boolean', 'file'];

@Injectable()
export class StagesService {
  private readonly logger = new Logger(StagesService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
  ) {}

  private validateRequirements(requirements: any) {
    if (!Array.isArray(requirements)) {
      throw new BadRequestException('requirements must be an array');
    }

    const keys = new Set<string>();

    for (let i = 0; i < requirements.length; i++) {
      const req = requirements[i];

      if (!req.key || typeof req.key !== 'string') {
        throw new BadRequestException(`requirements[${i}]: key is required and must be a string`);
      }

      if (keys.has(req.key)) {
        throw new BadRequestException(
          `requirements[${i}]: duplicate key "${req.key}"`,
        );
      }
      keys.add(req.key);

      if (!req.label || typeof req.label !== 'string') {
        throw new BadRequestException(
          `requirements[${i}] ("${req.key}"): label is required and must be a string`,
        );
      }

      if (!req.type || !SUPPORTED_FIELD_TYPES.includes(req.type)) {
        throw new BadRequestException(
          `requirements[${i}] ("${req.key}"): type must be one of: ${SUPPORTED_FIELD_TYPES.join(', ')}`,
        );
      }
    }
  }

  private validateEvaluationCriteria(criteria: any) {
    if (!Array.isArray(criteria)) {
      throw new BadRequestException('evaluationCriteria must be an array');
    }

    const names = new Set<string>();

    for (let i = 0; i < criteria.length; i++) {
      const c = criteria[i];

      if (!c.name || typeof c.name !== 'string') {
        throw new BadRequestException(
          `evaluationCriteria[${i}]: name is required and must be a string`,
        );
      }

      if (names.has(c.name)) {
        throw new BadRequestException(
          `evaluationCriteria[${i}]: duplicate name "${c.name}"`,
        );
      }
      names.add(c.name);

      if (c.maxScore === undefined || c.maxScore === null || typeof c.maxScore !== 'number' || c.maxScore <= 0) {
        throw new BadRequestException(
          `evaluationCriteria[${i}] ("${c.name}"): maxScore is required and must be a positive number`,
        );
      }

      if (c.weight !== undefined && (typeof c.weight !== 'number' || c.weight <= 0)) {
        throw new BadRequestException(
          `evaluationCriteria[${i}] ("${c.name}"): weight must be a positive number`,
        );
      }
    }
  }

  private validatePromotionRule(rule: any) {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      throw new BadRequestException('promotionRule must be an object');
    }

    const validTypes = ['TOP_N', 'MINIMUM_SCORE', 'MANUAL_SELECTION'];
    if (!rule.type || !validTypes.includes(rule.type)) {
      throw new BadRequestException(
        `promotionRule.type must be one of: ${validTypes.join(', ')}`,
      );
    }

    if (rule.type === 'TOP_N') {
      if (rule.value === undefined || rule.value === null || typeof rule.value !== 'number' || rule.value < 1 || !Number.isInteger(rule.value)) {
        throw new BadRequestException('promotionRule.value is required and must be a positive integer for type "TOP_N"');
      }
    }

    if (rule.type === 'MINIMUM_SCORE') {
      if (rule.value === undefined || rule.value === null || typeof rule.value !== 'number' || rule.value <= 0 || rule.value > 100) {
        throw new BadRequestException('promotionRule.value is required and must be between 1 and 100 for type "MINIMUM_SCORE" (normalized percentage)');
      }
    }
  }

  private validateStageConfig(dto: CreateStageDto | UpdateStageDto) {
    if (dto.requirements) {
      this.validateRequirements(dto.requirements);
    }

    if (dto.evaluationCriteria) {
      this.validateEvaluationCriteria(dto.evaluationCriteria);
    }

    if (dto.promotionRule) {
      this.validatePromotionRule(dto.promotionRule);
    }
  }

  private async renumberRemaining(hackathonId: string) {
    const remaining = await this.prisma.stageConfig.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
      select: { id: true },
    });

    if (remaining.length > 0) {
      await this.prisma.$transaction(
        remaining.map((stage, index) =>
          this.prisma.stageConfig.update({
            where: { id: stage.id },
            data: { order: index + 1 },
          }),
        ),
      );
    }
  }

  async create(hackathonId: string, dto: CreateStageDto, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    this.validateStageConfig(dto);

    const existing = await this.prisma.stageConfig.findUnique({
      where: { hackathonId_order: { hackathonId, order: dto.order } },
    });

    if (existing) {
      throw new BadRequestException(`Stage order ${dto.order} already exists for this hackathon`);
    }

    const stage = await this.prisma.stageConfig.create({
      data: {
        hackathonId,
        name: dto.name,
        description: dto.description,
        order: dto.order,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        isActive: dto.isActive ?? true,
        requirements: dto.requirements ?? undefined,
        evaluationCriteria: dto.evaluationCriteria ?? undefined,
        promotionRule: dto.promotionRule ?? undefined,
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'STAGE_CREATED',
      entity: 'StageConfig',
      entityId: stage.id,
      metadata: { name: stage.name, order: stage.order },
    });

    this.logger.log(`Stage "${stage.name}" created for hackathon ${hackathonId}`);
    return stage;
  }

  async findAll(hackathonId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    return this.prisma.stageConfig.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(hackathonId: string, stageId: string) {
    const stage = await this.prisma.stageConfig.findFirst({
      where: { id: stageId, hackathonId },
    });

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    return stage;
  }

  async update(hackathonId: string, stageId: string, dto: UpdateStageDto, userId: string) {
    const stage = await this.findOne(hackathonId, stageId);

    this.validateStageConfig(dto);

    const configFields = ['requirements', 'evaluationCriteria', 'promotionRule'];
    const changingConfig = configFields.some((f) => (dto as any)[f] !== undefined);

    if (changingConfig) {
      const submissionCount = await this.prisma.submission.count({
        where: { stageId },
      });

      if (submissionCount > 0 && !dto.force) {
        throw new BadRequestException(
          `Cannot change stage configuration: ${submissionCount} submission(s) exist. ` +
          'Set force=true to override (organizer/admin only).',
        );
      }
    }

    if (dto.order !== undefined && dto.order !== stage.order) {
      const existing = await this.prisma.stageConfig.findUnique({
        where: { hackathonId_order: { hackathonId, order: dto.order } },
      });

      if (existing && existing.id !== stageId) {
        throw new BadRequestException(`Stage order ${dto.order} already exists for this hackathon`);
      }
    }

    const updated = await this.prisma.stageConfig.update({
      where: { id: stageId },
      data: {
        name: dto.name,
        description: dto.description,
        order: dto.order,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : undefined,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
        isActive: dto.isActive,
        requirements: dto.requirements,
        evaluationCriteria: dto.evaluationCriteria,
        promotionRule: dto.promotionRule,
      },
    });

    const changes = Object.keys(dto).filter((k) => k !== 'force');
    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'STAGE_UPDATED',
      entity: 'StageConfig',
      entityId: stageId,
      metadata: { changes, force: dto.force === true },
    });

    this.logger.log(`Stage "${updated.name}" updated`);
    return updated;
  }

  async delete(hackathonId: string, stageId: string, userId: string) {
    const stage = await this.findOne(hackathonId, stageId);

    const submissionCount = await this.prisma.submission.count({
      where: { stageId },
    });

    if (submissionCount > 0) {
      throw new BadRequestException(
        `Cannot delete stage "${stage.name}": ${submissionCount} submission(s) exist`,
      );
    }

    await this.prisma.stageConfig.delete({ where: { id: stageId } });

    await this.renumberRemaining(hackathonId);

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'STAGE_DELETED',
      entity: 'StageConfig',
      entityId: stageId,
      metadata: { name: stage.name },
    });

    this.logger.log(`Stage "${stage.name}" deleted and remaining stages renumbered`);
    return this.findAll(hackathonId);
  }

  async reorder(hackathonId: string, dto: ReorderStagesDto, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const stages = await this.prisma.stageConfig.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
    });

    const existingIds = new Set(stages.map((s) => s.id));
    for (const id of dto.stageIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Stage ${id} does not belong to this hackathon`);
      }
    }

    if (dto.stageIds.length !== stages.length) {
      throw new BadRequestException('All stages must be included in reorder');
    }

    if (dto.stageIds.length === 0) {
      return [];
    }

    const oldOrder = stages.map((s) => ({ id: s.id, order: s.order }));

    if (!dto.force) {
      for (const id of dto.stageIds) {
        const count = await this.prisma.submission.count({ where: { stageId: id } });
        if (count > 0) {
          throw new BadRequestException(
            `Stage ${id} has ${count} submission(s). Set force=true to reorder anyway.`,
          );
        }
      }
    } else {
      const isOwner = hackathon.organizerId === userId;
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const isSuperAdmin = user?.role === 'SUPER_ADMIN';

      if (!isOwner && !isSuperAdmin) {
        throw new BadRequestException(
          'Only the hackathon organizer or SUPER_ADMIN can force reorder.',
        );
      }
    }

    await this.prisma.$transaction(
      dto.stageIds.map((id, index) =>
        this.prisma.stageConfig.update({
          where: { id },
          data: { order: index + 1 },
        }),
      ),
    );

    const newOrder = dto.stageIds.map((id, index) => ({ id, order: index + 1 }));
    const oldOrderMap = Object.fromEntries(oldOrder.map((s) => [s.id, s.order]));
    const orderChanges = newOrder.map((s) => ({
      stageId: s.id,
      oldOrder: oldOrderMap[s.id],
      newOrder: s.order,
    }));

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'STAGES_REORDERED',
      entity: 'StageConfig',
      entityId: hackathonId,
      metadata: {
        oldOrder: oldOrderMap,
        newOrder: Object.fromEntries(newOrder.map((s) => [s.id, s.order])),
        orderChanges,
        force: dto.force === true,
        userId,
        timestamp: new Date().toISOString(),
      },
    });

    this.logger.log(
      `Stages reordered for hackathon ${hackathonId}${dto.force ? ' (forced)' : ''}`,
    );
    return this.findAll(hackathonId);
  }
}
