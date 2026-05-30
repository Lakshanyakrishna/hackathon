import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async findAll(pagination: PaginationDto, hackathonId?: string) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where: any = {};

    if (hackathonId) {
      where.hackathonId = hackathonId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        include: {
          owner: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          _count: {
            select: { members: true, submissions: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.team.count({ where }),
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

  async findById(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, college: true },
            },
          },
        },
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            minTeamSize: true,
            maxTeamSize: true,
          },
        },
        _count: {
          select: { submissions: true, invitations: true },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  async create(dto: CreateTeamDto, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: dto.hackathonId },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.status !== 'PUBLISHED' && hackathon.status !== 'ONGOING') {
      throw new BadRequestException('Cannot create team for unpublished hackathon');
    }

    if (new Date() > hackathon.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    const existingTeamByName = await this.prisma.team.findUnique({
      where: {
        hackathonId_name: {
          hackathonId: dto.hackathonId,
          name: dto.name,
        },
      },
    });

    if (existingTeamByName) {
      throw new ConflictException('Team name already taken in this hackathon');
    }

    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { hackathonId: dto.hackathonId },
      },
      include: { team: true },
    });

    if (existingMembership) {
      throw new BadRequestException(
        `You are already a member of team "${existingMembership.team.name}" in this hackathon`,
      );
    }

    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        description: dto.description,
        hackathonId: dto.hackathonId,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'LEADER',
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: dto.hackathonId,
      action: 'TEAM_CREATED',
      entity: 'Team',
      entityId: team.id,
      metadata: { teamName: team.name },
    });

    this.logger.log(`Team created: ${team.name} by user ${userId}`);
    return team;
  }

  async update(id: string, dto: UpdateTeamDto, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { hackathon: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the team owner can update the team');
      }
    }

    if (team.isLocked) {
      throw new BadRequestException('Cannot update a locked team');
    }

    if (team.isDisqualified) {
      throw new BadRequestException('Cannot update a disqualified team');
    }

    if (dto.name && dto.name !== team.name) {
      const existing = await this.prisma.team.findUnique({
        where: {
          hackathonId_name: {
            hackathonId: team.hackathonId,
            name: dto.name,
          },
        },
      });
      if (existing) {
        throw new ConflictException('Team name already taken in this hackathon');
      }
    }

    const updated = await this.prisma.team.update({
      where: { id },
      data: dto,
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: team.hackathonId,
      action: 'TEAM_UPDATED',
      entity: 'Team',
      entityId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async join(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: {
        hackathon: true,
        members: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.isLocked) {
      throw new BadRequestException('Team is locked and not accepting new members');
    }

    if (team.isDisqualified) {
      throw new BadRequestException('Cannot join a disqualified team');
    }

    if (new Date() > team.hackathon.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed');
    }

    if (team.members.length >= team.hackathon.maxTeamSize) {
      throw new BadRequestException(
        `Team is full (max ${team.hackathon.maxTeamSize} members)`,
      );
    }

    const alreadyMember = team.members.find((m) => m.userId === userId);
    if (alreadyMember) {
      throw new ConflictException('You are already a member of this team');
    }

    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { hackathonId: team.hackathonId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException(
        'You are already in another team in this hackathon',
      );
    }

    const member = await this.prisma.teamMember.create({
      data: {
        teamId: id,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: team.hackathonId,
      action: 'TEAM_JOINED',
      entity: 'Team',
      entityId: id,
      metadata: { teamName: team.name },
    });

    this.logger.log(`User ${userId} joined team ${team.name}`);
    return member;
  }

  async leave(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId === userId) {
      throw new BadRequestException(
        'Team owner cannot leave. Transfer ownership or delete the team.',
      );
    }

    const membership = team.members.find((m) => m.userId === userId);
    if (!membership) {
      throw new BadRequestException('You are not a member of this team');
    }

    await this.prisma.teamMember.delete({
      where: { id: membership.id },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: team.hackathonId,
      action: 'TEAM_LEFT',
      entity: 'Team',
      entityId: id,
      metadata: { teamName: team.name },
    });

    this.logger.log(`User ${userId} left team ${team.name}`);
    return { message: 'Left team successfully' };
  }

  async lock(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { hackathon: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the hackathon organizer can lock teams');
      }
    }

    const updated = await this.prisma.team.update({
      where: { id },
      data: { isLocked: !team.isLocked },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: team.hackathonId,
      action: updated.isLocked ? 'TEAM_LOCKED' : 'TEAM_UNLOCKED',
      entity: 'Team',
      entityId: id,
      metadata: { teamName: team.name },
    });

    return updated;
  }

  async disqualify(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { hackathon: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the hackathon organizer can disqualify teams');
      }
    }

    const updated = await this.prisma.team.update({
      where: { id },
      data: { isDisqualified: !team.isDisqualified },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId: team.hackathonId,
      action: updated.isDisqualified ? 'TEAM_DISQUALIFIED' : 'TEAM_REINSTATED',
      entity: 'Team',
      entityId: id,
      metadata: { teamName: team.name },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { hackathon: true, members: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const isOwner = team.ownerId === userId;
    const isHackathonOrganizer = team.hackathon.organizerId === userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    if (!isOwner && !isHackathonOrganizer && !isSuperAdmin) {
      throw new ForbiddenException('Not authorized to delete this team');
    }

    await this.prisma.team.delete({ where: { id } });

    await this.activityLogsService.log({
      userId,
      hackathonId: team.hackathonId,
      action: 'TEAM_DELETED',
      entity: 'Team',
      entityId: id,
      metadata: { teamName: team.name },
    });

    this.logger.log(`Team deleted: ${team.name}`);
    return { message: 'Team deleted successfully' };
  }

  async findMyTeams(userId: string) {
    const memberships = await this.prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            hackathon: {
              select: { id: true, title: true, slug: true, status: true },
            },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => m.team);
  }
}
