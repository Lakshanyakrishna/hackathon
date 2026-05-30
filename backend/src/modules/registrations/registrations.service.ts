import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ReviewRegistrationDto } from './dto/review-registration.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RegistrationStatus } from '@prisma/client';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
    private notificationsService: NotificationsService,
  ) {}

  async register(dto: CreateRegistrationDto, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: dto.hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.status !== 'PUBLISHED' && hackathon.status !== 'ONGOING') {
      throw new BadRequestException('Hackathon is not open for registration');
    }

    if (new Date() > hackathon.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    const existing = await this.prisma.registration.findUnique({
      where: {
        userId_hackathonId: {
          userId,
          hackathonId: dto.hackathonId,
        },
      },
    });

    if (existing) {
      if (existing.status === 'CANCELLED') {
        const existingPayment = await this.prisma.payment.findFirst({
          where: { registrationId: existing.id, status: 'SUCCESS' },
        });

        if (existingPayment) {
          throw new ConflictException(
            'You had a previous registration with a successful payment. Contact organizer.',
          );
        }
      } else if (existing.status === 'APPROVED') {
        throw new ConflictException('You are already registered for this hackathon');
      } else if (existing.status === 'PENDING_PAYMENT') {
        throw new ConflictException(
          'You have a pending payment for this hackathon. Complete the payment first.',
        );
      } else if (existing.status === 'PENDING_APPROVAL') {
        throw new ConflictException('Your registration is pending approval');
      } else {
        throw new ConflictException(
          `Your registration is ${existing.status.toLowerCase()}`,
        );
      }
    }

    let teamId = dto.teamId || null;

    if (teamId) {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
        include: { members: true },
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }

      if (team.hackathonId !== dto.hackathonId) {
        throw new BadRequestException('Team does not belong to this hackathon');
      }

      if (team.isLocked) {
        throw new BadRequestException('Team is locked');
      }

      if (team.isDisqualified) {
        throw new BadRequestException('Team is disqualified');
      }

      const isMember = team.members.some((m) => m.userId === userId);
      if (!isMember) {
        throw new BadRequestException('You must be a team member to register with a team');
      }
    } else {
      if (hackathon.minTeamSize > 1) {
        throw new BadRequestException(
          `This hackathon requires a minimum team size of ${hackathon.minTeamSize}. Please create or join a team first.`,
        );
      }
    }

    let status: RegistrationStatus;

    if (hackathon.registrationFee.toNumber() > 0) {
      status = 'PENDING_PAYMENT';
    } else if (hackathon.registrationMode === 'APPROVAL_REQUIRED') {
      status = 'PENDING_APPROVAL';
    } else {
      status = 'APPROVED';
    }

    const registration = await this.prisma.registration.create({
      data: {
        userId,
        hackathonId: dto.hackathonId,
        teamId: teamId || undefined,
        status,
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: dto.hackathonId,
      action: 'REGISTRATION_CREATED',
      entity: 'Registration',
      entityId: registration.id,
      metadata: { status, teamId },
    });

    this.logger.log(
      `Registration created: user ${userId} -> hackathon ${dto.hackathonId} (status: ${status})`,
    );

    return {
      registration,
      requiresPayment: hackathon.registrationFee.toNumber() > 0,
      requiresApproval: hackathon.registrationMode === 'APPROVAL_REQUIRED' && hackathon.registrationFee.toNumber() === 0,
    };
  }

  async findAll(pagination: PaginationDto, filters?: {
    hackathonId?: string;
    status?: string;
    userId?: string;
  }) {
    const { page = 1, limit = 10, sortBy = 'registeredAt', sortOrder = 'desc' } = pagination;

    const where: any = {};

    if (filters?.hackathonId) where.hackathonId = filters.hackathonId;
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;

    const [data, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, college: true },
          },
          team: {
            select: { id: true, name: true },
          },
          hackathon: {
            select: { id: true, title: true, slug: true, organizerId: true },
          },
          payment: {
            select: { id: true, status: true, amount: true, razorpayPaymentId: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAllByOrganizer(pagination: PaginationDto, organizerId: string) {
    const { page = 1, limit = 10, sortBy = 'registeredAt', sortOrder = 'desc' } = pagination;

    const organizerHackathons = await this.prisma.hackathon.findMany({
      where: { organizerId },
      select: { id: true },
    });

    const hackathonIds = organizerHackathons.map((h) => h.id);

    const where: any = {
      hackathonId: { in: hackathonIds },
    };

    const [data, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, college: true },
          },
          team: {
            select: { id: true, name: true },
          },
          hackathon: {
            select: { id: true, title: true, slug: true },
          },
          payment: {
            select: { id: true, status: true, amount: true, razorpayPaymentId: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findAllByOwnedHackathon(pagination: PaginationDto, hackathonId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { id: true, organizerId: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.organizerId !== userId) {
      throw new ForbiddenException('You do not own this hackathon');
    }

    const { page = 1, limit = 10, sortBy = 'registeredAt', sortOrder = 'desc' } = pagination;

    const where: any = { hackathonId };

    const [data, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, college: true },
          },
          team: {
            select: { id: true, name: true },
          },
          hackathon: {
            select: { id: true, title: true, slug: true },
          },
          payment: {
            select: { id: true, status: true, amount: true, razorpayPaymentId: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.registration.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string, userId: string, userRole: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, college: true },
        },
        team: {
          select: { id: true, name: true },
        },
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            organizerId: true,
            registrationFee: true,
            registrationMode: true,
            minTeamSize: true,
          },
        },
        payment: {
          select: { id: true, status: true, amount: true, razorpayPaymentId: true, paidAt: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const isOwner = registration.userId === userId;
    const isHackathonOwner = registration.hackathon.organizerId === userId;
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    if (!isOwner && !isHackathonOwner && !isSuperAdmin) {
      throw new ForbiddenException('Not authorized to view this registration');
    }

    return registration;
  }

  async findByUser(userId: string) {
    const registrations = await this.prisma.registration.findMany({
      where: { userId },
      include: {
        team: {
          select: { id: true, name: true },
        },
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            startDate: true,
            endDate: true,
            banner: true,
            mode: true,
          },
        },
        payment: {
          select: { id: true, status: true, amount: true },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return registrations;
  }

  async approve(id: string, userId: string, dto?: ReviewRegistrationDto) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        hackathon: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Only the hackathon organizer can approve registrations',
        );
      }
    }

    if (registration.status === 'APPROVED') {
      throw new BadRequestException('Registration is already approved');
    }

    if (registration.status === 'REJECTED') {
      throw new BadRequestException('Registration was rejected and cannot be approved');
    }

    if (registration.status === 'CANCELLED') {
      throw new BadRequestException('Registration was cancelled');
    }

    if (registration.hackathon.minTeamSize > 1) {
      const teamMember = await this.prisma.teamMember.findFirst({
        where: {
          userId: registration.userId,
          team: { hackathonId: registration.hackathonId },
        },
        include: {
          team: {
            include: { _count: { select: { members: true } } },
          },
        },
      });

      if (!teamMember) {
        throw new BadRequestException(
          'User is not part of any team for this hackathon',
        );
      }

      if (teamMember.team._count.members < registration.hackathon.minTeamSize) {
        throw new BadRequestException(
          `Team must have at least ${registration.hackathon.minTeamSize} members before approval`,
        );
      }
    }

    const updated = await this.prisma.registration.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: registration.hackathonId,
      action: 'REGISTRATION_APPROVED',
      entity: 'Registration',
      entityId: id,
      metadata: { registeredUserId: registration.userId },
    });

    await this.notificationsService.create({
      userId: registration.userId,
      type: 'REGISTRATION_APPROVED',
      title: 'Registration Approved',
      message: `Your registration for "${registration.hackathon.title}" has been approved.`,
      data: { hackathonId: registration.hackathonId, registrationId: id },
    });

    this.logger.log(`Registration ${id} approved by ${userId}`);
    return updated;
  }

  async reject(id: string, userId: string, dto?: ReviewRegistrationDto) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        hackathon: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Only the hackathon organizer can reject registrations',
        );
      }
    }

    if (registration.status === 'APPROVED') {
      throw new BadRequestException('Registration is already approved');
    }

    if (registration.status === 'REJECTED') {
      throw new BadRequestException('Registration is already rejected');
    }

    if (registration.status === 'CANCELLED') {
      throw new BadRequestException('Registration was cancelled');
    }

    const updated = await this.prisma.registration.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: registration.hackathonId,
      action: 'REGISTRATION_REJECTED',
      entity: 'Registration',
      entityId: id,
      metadata: { registeredUserId: registration.userId, reason: dto?.reason },
    });

    await this.notificationsService.create({
      userId: registration.userId,
      type: 'REGISTRATION_REJECTED',
      title: 'Registration Rejected',
      message: `Your registration for "${registration.hackathon.title}" was rejected.${dto?.reason ? ` Reason: ${dto.reason}` : ''}`,
      data: { hackathonId: registration.hackathonId, registrationId: id, reason: dto?.reason },
    });

    this.logger.log(`Registration ${id} rejected by ${userId}`);
    return updated;
  }

  async cancel(id: string, userId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own registration');
    }

    if (registration.status === 'CANCELLED') {
      throw new BadRequestException('Registration is already cancelled');
    }

    if (registration.status === 'APPROVED') {
      throw new BadRequestException(
        'Registration is already approved. Contact organizer to cancel.',
      );
    }

    if (registration.payment?.status === 'SUCCESS') {
      throw new BadRequestException(
        'You have a completed payment. Contact organizer for a refund.',
      );
    }

    const updated = await this.prisma.registration.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: registration.hackathonId,
      action: 'REGISTRATION_CANCELLED',
      entity: 'Registration',
      entityId: id,
    });

    this.logger.log(`Registration ${id} cancelled by ${userId}`);
    return updated;
  }

  async getPendingForHackathon(hackathonId: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Only the hackathon organizer can view pending registrations',
        );
      }
    }

    const registrations = await this.prisma.registration.findMany({
      where: {
        hackathonId,
        status: 'PENDING_APPROVAL',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, college: true, phone: true },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });

    return registrations;
  }

  async getStats(hackathonId: string) {
    const [total, pending, approved, rejected, cancelled] = await Promise.all([
      this.prisma.registration.count({ where: { hackathonId } }),
      this.prisma.registration.count({
        where: { hackathonId, status: { in: ['PENDING_PAYMENT', 'PENDING_APPROVAL'] } },
      }),
      this.prisma.registration.count({ where: { hackathonId, status: 'APPROVED' } }),
      this.prisma.registration.count({ where: { hackathonId, status: 'REJECTED' } }),
      this.prisma.registration.count({ where: { hackathonId, status: 'CANCELLED' } }),
    ]);

    return { total, pending, approved, rejected, cancelled };
  }
}
