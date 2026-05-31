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
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { Prisma } from '@prisma/client';

const SUPPORTED_TYPES = ['text', 'textarea', 'url', 'number', 'boolean', 'file'];

function validateField(value: unknown, req: any, label: string) {
  if (req.required && (value === undefined || value === null || value === '')) {
    throw new BadRequestException(`${label} is required`);
  }
  if (value === undefined || value === null || value === '') return;

  switch (req.type) {
    case 'url':
      if (typeof value !== 'string' || !/^https?:\/\/.+/.test(value)) {
        throw new BadRequestException(`${label} must be a valid URL`);
      }
      break;
    case 'number':
      if (isNaN(Number(value))) {
        throw new BadRequestException(`${label} must be a number`);
      }
      break;
    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        throw new BadRequestException(`${label} must be true or false`);
      }
      break;
    case 'file':
      break;
    case 'textarea':
    case 'text':
      if (typeof value !== 'string') {
        throw new BadRequestException(`${label} must be text`);
      }
      break;
  }
}

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
    private notificationsService: NotificationsService,
  ) {}

  private async getStageOrThrow(stageId: string) {
    const stage = await this.prisma.stageConfig.findUnique({
      where: { id: stageId },
    });
    if (!stage) throw new NotFoundException('Stage not found');
    return stage;
  }

  private async getTeamOrThrow(teamId: string, hackathonId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });
    if (!team) throw new NotFoundException('Team not found');
    if (team.hackathonId !== hackathonId) {
      throw new BadRequestException('Team does not belong to this hackathon');
    }
    return team;
  }

  private async checkTeamMembership(teamId: string, userId: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this team');
  }

  private async checkApprovedRegistration(teamId: string, hackathonId: string) {
    const members = await this.prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });

    for (const member of members) {
      const registration = await this.prisma.registration.findUnique({
        where: {
          userId_hackathonId: {
            userId: member.userId,
            hackathonId,
          },
        },
      });
      if (!registration || registration.status !== 'APPROVED') {
        throw new ForbiddenException(
          `Team member ${member.userId} does not have an approved registration`,
        );
      }
    }
  }

  private checkDeadline(stage: { endDate: Date | null }) {
    if (stage.endDate && new Date() > stage.endDate) {
      throw new BadRequestException('Submission deadline has passed for this stage');
    }
  }

  private checkPromotion(team: { promotedToStageOrder: number }, stage: { order: number }) {
    if (team.promotedToStageOrder < stage.order) {
      throw new BadRequestException(
        `Team has not been promoted to this stage yet (current max stage order: ${team.promotedToStageOrder})`,
      );
    }
  }

  private validateData(data: Record<string, any> | null | undefined, requirements: any) {
    if (!Array.isArray(requirements)) return;

    const dataMap = data || {};

    for (const req of requirements) {
      if (!SUPPORTED_TYPES.includes(req.type)) continue;
      validateField(dataMap[req.key], req, req.label || req.key);
    }
  }

  async create(dto: CreateSubmissionDto, userId: string) {
    const stage = await this.getStageOrThrow(dto.stageId);
    const team = await this.getTeamOrThrow(dto.teamId, stage.hackathonId);
    const hackathonId = stage.hackathonId;

    await this.checkTeamMembership(team.id, userId);
    await this.checkApprovedRegistration(team.id, hackathonId);
    this.checkPromotion(team, stage);

    const existingDraft = await this.prisma.submission.findFirst({
      where: {
        teamId: team.id,
        stageId: dto.stageId,
        status: 'DRAFT',
      },
    });

    if (existingDraft) {
      throw new BadRequestException(
        'You already have a draft submission for this stage. Edit or submit it instead.',
      );
    }

    const latestVersion = await this.prisma.submission.findFirst({
      where: { teamId: team.id, stageId: dto.stageId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    const submission = await this.prisma.submission.create({
      data: {
        teamId: team.id,
        hackathonId,
        stageId: dto.stageId,
        version: nextVersion,
        data: dto.data ?? Prisma.DbNull,
        title: dto.title,
        description: dto.description,
        notes: dto.notes,
        status: 'DRAFT',
      },
      include: {
        team: { select: { id: true, name: true } },
        hackathon: { select: { id: true, title: true, slug: true } },
        stage: { select: { id: true, name: true, order: true, requirements: true, evaluationCriteria: true, promotionRule: true, startDate: true, endDate: true } },
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'SUBMISSION_CREATED',
      entity: 'Submission',
      entityId: submission.id,
      metadata: { stageId: dto.stageId, version: nextVersion },
    });

    this.logger.log(`Submission v${nextVersion} created for team ${team.id} stage ${dto.stageId}`);
    return submission;
  }

  async findAll(userId: string, userRole: string, filters: {
    hackathonId?: string;
    stageId?: string;
    teamId?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters.hackathonId) where.hackathonId = filters.hackathonId;
    if (filters.stageId) where.stageId = filters.stageId;
    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.status) where.status = filters.status;

    if (userRole === 'PARTICIPANT') {
      const teamIds = await this.prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      });
      where.teamId = { in: teamIds.map((t) => t.teamId) };
    }

    return this.prisma.submission.findMany({
      where,
      include: {
        team: { select: { id: true, name: true } },
        hackathon: { select: { id: true, title: true, slug: true } },
        stage: {
          select: {
            id: true, name: true, order: true,
            requirements: true, evaluationCriteria: true,
            promotionRule: true, startDate: true, endDate: true,
          },
        },
      },
      orderBy: [{ hackathonId: 'asc' }, { stageId: 'asc' }, { version: 'desc' }],
    });
  }

  async findOne(id: string, userId: string, userRole: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true, members: { select: { userId: true } } } },
        hackathon: { select: { id: true, title: true, slug: true, organizerId: true } },
        stage: {
          select: {
            id: true, name: true, order: true,
            requirements: true, evaluationCriteria: true,
            promotionRule: true, startDate: true, endDate: true,
          },
        },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    this.enforceAccess(submission, userId, userRole);
    return submission;
  }

  private enforceAccess(submission: any, userId: string, userRole: string) {
    if (userRole === 'SUPER_ADMIN') return;

    if (userRole === 'PARTICIPANT') {
      const isMember = submission.team?.members?.some((m: any) => m.userId === userId);
      if (!isMember) throw new NotFoundException('Submission not found');
      return;
    }

    throw new NotFoundException('Submission not found');
  }

  async update(id: string, dto: UpdateSubmissionDto, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true, promotedToStageOrder: true, members: { select: { userId: true } } } },
        stage: true,
        hackathon: { select: { id: true, organizerId: true } },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    const isMember = submission.team.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('You are not a member of this team');

    if (submission.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot edit submission with status ${submission.status}`);
    }

    this.checkDeadline(submission.stage);

    const updated = await this.prisma.submission.update({
      where: { id },
      data: {
        data: dto.data !== undefined ? (dto.data as any) : undefined,
        title: dto.title,
        description: dto.description,
        notes: dto.notes,
      },
      include: {
        team: { select: { id: true, name: true } },
        hackathon: { select: { id: true, title: true, slug: true } },
        stage: {
          select: {
            id: true, name: true, order: true,
            requirements: true, evaluationCriteria: true,
            promotionRule: true, startDate: true, endDate: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: submission.hackathonId,
      action: 'SUBMISSION_UPDATED',
      entity: 'Submission',
      entityId: id,
    });

    return updated;
  }

  async submit(id: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true, promotedToStageOrder: true, members: { select: { userId: true } } } },
        stage: true,
        hackathon: { select: { id: true, title: true, slug: true, organizerId: true } },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    const isMember = submission.team.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('You are not a member of this team');

    if (submission.status !== 'DRAFT') {
      throw new BadRequestException(`Cannot submit submission with status ${submission.status}`);
    }

    this.checkDeadline(submission.stage);

    const requirements = submission.stage.requirements as any;
    this.validateData(submission.data as Record<string, any>, requirements);

    const updated = await this.prisma.submission.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedBy: userId,
      },
      include: {
        team: { select: { id: true, name: true } },
        hackathon: { select: { id: true, title: true, slug: true } },
        stage: {
          select: {
            id: true, name: true, order: true,
            requirements: true, evaluationCriteria: true,
            promotionRule: true, startDate: true, endDate: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: submission.hackathonId,
      action: 'SUBMISSION_SUBMITTED',
      entity: 'Submission',
      entityId: id,
      metadata: { version: submission.version, stageName: submission.stage.name },
    });

    await this.notificationsService.create({
      userId: submission.hackathon.organizerId,
      type: 'SUBMISSION_SUBMITTED',
      title: 'New Submission',
      message: `Team "${submission.team.name}" submitted "${submission.stage.name}" (v${submission.version})`,
      data: {
        hackathonId: submission.hackathonId,
        submissionId: id,
        teamId: submission.teamId,
        stageId: submission.stageId,
        version: submission.version,
      },
    });

    this.logger.log(`Submission ${id} submitted (v${submission.version})`);
    return updated;
  }

  async resubmit(id: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true, promotedToStageOrder: true, members: { select: { userId: true } } } },
        stage: true,
        hackathon: { select: { id: true, organizerId: true } },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    const isMember = submission.team.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('You are not a member of this team');

    if (submission.status !== 'SUBMITTED') {
      throw new BadRequestException(
        `Can only resubmit a SUBMITTED submission. Current status: ${submission.status}`,
      );
    }

    this.checkDeadline(submission.stage);
    this.checkPromotion(submission.team, submission.stage);

    const latestVersion = await this.prisma.submission.findFirst({
      where: { teamId: submission.teamId, stageId: submission.stageId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    const newSubmission = await this.prisma.submission.create({
      data: {
        teamId: submission.teamId,
        hackathonId: submission.hackathonId,
        stageId: submission.stageId,
        version: nextVersion,
        data: submission.data as any,
        title: submission.title,
        description: submission.description,
        notes: submission.notes,
        status: 'DRAFT',
        previousVersionId: submission.id,
      },
      include: {
        team: { select: { id: true, name: true } },
        hackathon: { select: { id: true, title: true, slug: true } },
        stage: {
          select: {
            id: true, name: true, order: true,
            requirements: true, evaluationCriteria: true,
            promotionRule: true, startDate: true, endDate: true,
          },
        },
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: submission.hackathonId,
      action: 'SUBMISSION_RESUBMITTED',
      entity: 'Submission',
      entityId: newSubmission.id,
      metadata: {
        previousVersion: submission.version,
        newVersion: nextVersion,
        previousSubmissionId: submission.id,
      },
    });

    this.logger.log(`Submission resubmitted: v${nextVersion} from v${submission.version}`);
    return newSubmission;
  }

  async lock(id: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        hackathon: { select: { id: true, organizerId: true, title: true } },
        team: { select: { name: true } },
        stage: { select: { name: true } },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    if (submission.hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the hackathon organizer can lock submissions');
      }
    }

    if (submission.status === 'LOCKED') {
      throw new BadRequestException('Submission is already locked');
    }

    const updated = await this.prisma.submission.update({
      where: { id },
      data: { status: 'LOCKED' },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: submission.hackathon.id,
      action: 'SUBMISSION_LOCKED',
      entity: 'Submission',
      entityId: id,
    });

    const teamMembers = await this.prisma.teamMember.findMany({
      where: { teamId: submission.teamId },
      select: { userId: true },
    });

    for (const member of teamMembers) {
      await this.notificationsService.create({
        userId: member.userId,
        type: 'SUBMISSION_REVIEWED',
        title: 'Submission Locked',
        message: `Your submission for "${submission.stage.name}" in "${submission.hackathon.title}" has been locked by the organizer.`,
        data: { hackathonId: submission.hackathon.id, submissionId: id },
      });
    }

    this.logger.log(`Submission ${id} locked`);
    return updated;
  }

  async reopen(id: string, userId: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        hackathon: { select: { id: true, organizerId: true, title: true } },
        team: { select: { id: true, name: true, promotedToStageOrder: true } },
        stage: { select: { id: true, name: true, order: true } },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    if (submission.hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the hackathon organizer can reopen submissions');
      }
    }

    let updated;

    if (submission.status === 'SUBMITTED') {
      const latestVersion = await this.prisma.submission.findFirst({
        where: { teamId: submission.teamId, stageId: submission.stageId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      updated = await this.prisma.submission.create({
        data: {
          teamId: submission.teamId,
          hackathonId: submission.hackathonId,
          stageId: submission.stageId,
          version: nextVersion,
          data: submission.data as any,
          title: submission.title,
          description: submission.description,
          notes: submission.notes,
          status: 'DRAFT',
          previousVersionId: submission.id,
        },
      });
    } else if (submission.status === 'LOCKED') {
      updated = await this.prisma.submission.update({
        where: { id },
        data: { status: 'DRAFT' },
      });
    } else {
      throw new BadRequestException(`Cannot reopen submission with status ${submission.status}`);
    }

    await this.activityLogsService.log({
      userId,
      hackathonId: submission.hackathon.id,
      action: 'SUBMISSION_REOPENED',
      entity: 'Submission',
      entityId: updated.id,
      metadata: { newStatus: 'DRAFT' },
    });

    const teamMembers = await this.prisma.teamMember.findMany({
      where: { teamId: submission.teamId },
      select: { userId: true },
    });

    for (const member of teamMembers) {
      await this.notificationsService.create({
        userId: member.userId,
        type: 'SUBMISSION_REVIEWED',
        title: 'Submission Reopened',
        message: `Your submission for "${submission.stage.name}" in "${submission.hackathon.title}" has been reopened by the organizer. You can now edit and resubmit.`,
        data: { hackathonId: submission.hackathon.id, submissionId: updated.id },
      });
    }

    this.logger.log(`Submission ${id} reopened`);
    return updated;
  }

  async getVersions(id: string, userId: string, userRole: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        team: { select: { id: true, name: true, members: { select: { userId: true } } } },
        hackathon: { select: { id: true, title: true, slug: true, organizerId: true } },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    this.enforceAccess(submission, userId, userRole);

    const versions = await this.prisma.submission.findMany({
      where: {
        teamId: submission.teamId,
        stageId: submission.stageId,
      },
      orderBy: { version: 'asc' },
      select: {
        id: true,
        version: true,
        status: true,
        data: true,
        title: true,
        description: true,
        submittedAt: true,
        submittedBy: true,
        previousVersionId: true,
        createdAt: true,
        reviewedBy: true,
        reviewNotes: true,
        team: { select: { id: true, name: true } },
      },
    });

    return versions;
  }

  async getPreview(id: string, userId: string, userRole: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            members: { select: { userId: true, user: { select: { name: true, email: true } } } },
          },
        },
        hackathon: { select: { id: true, title: true, slug: true, organizerId: true } },
        stage: {
          select: {
            id: true,
            name: true,
            description: true,
            order: true,
            requirements: true,
            evaluationCriteria: true,
            promotionRule: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');
    this.enforceAccess(submission, userId, userRole);

    const data = (submission.data as Record<string, any>) || {};
    const requirements = (submission.stage.requirements as any[]) || [];

    const fields = requirements.map((req: any) => ({
      key: req.key,
      label: req.label,
      type: req.type,
      required: req.required,
      value: data[req.key] || null,
    }));

    return {
      submission: {
        id: submission.id,
        version: submission.version,
        status: submission.status,
        submittedAt: submission.submittedAt,
        title: submission.title,
        description: submission.description,
      },
      stage: {
        id: submission.stage.id,
        name: submission.stage.name,
        description: submission.stage.description,
        order: submission.stage.order,
        startDate: submission.stage.startDate,
        endDate: submission.stage.endDate,
        requirements: submission.stage.requirements,
        evaluationCriteria: submission.stage.evaluationCriteria,
        promotionRule: submission.stage.promotionRule,
      },
      team: submission.team,
      hackathon: submission.hackathon,
      fields,
    };
  }
}
