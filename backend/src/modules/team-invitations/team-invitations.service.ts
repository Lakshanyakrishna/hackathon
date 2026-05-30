import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

const MAX_PENDING_INVITATIONS = 20;
const INVITATION_EXPIRY_DAYS = 7;

@Injectable()
export class TeamInvitationsService {
  private readonly logger = new Logger(TeamInvitationsService.name);

  constructor(
    private prisma: PrismaService,
    private activityLogsService: ActivityLogsService,
  ) {}

  async expireStale(): Promise<number> {
    const result = await this.prisma.teamInvitation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} stale invitations`);
    }
    return result.count;
  }

  async send(dto: CreateInvitationDto, inviterId: string) {
    if (!dto.email && !dto.username) {
      throw new BadRequestException('Either email or username is required');
    }

    await this.expireStale();

    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId },
      include: {
        members: true,
        invitations: {
          where: {
            status: 'PENDING',
            expiresAt: { gt: new Date() },
          },
        },
        hackathon: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== inviterId) {
      throw new ForbiddenException('Only the team owner can send invitations');
    }

    if (team.isLocked) {
      throw new BadRequestException('Cannot invite to a locked team');
    }

    if (team.isDisqualified) {
      throw new BadRequestException('Cannot invite to a disqualified team');
    }

    if (team.invitations.length >= MAX_PENDING_INVITATIONS) {
      throw new BadRequestException(
        `Maximum ${MAX_PENDING_INVITATIONS} pending invitations per team`,
      );
    }

    if (team.members.length >= team.hackathon.maxTeamSize) {
      throw new BadRequestException(
        `Team is full (max ${team.hackathon.maxTeamSize} members)`,
      );
    }

    let inviteeId: string | null = null;
    let inviteeEmail: string | null = null;

    if (dto.username) {
      const user = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (!user) {
        throw new NotFoundException(`User "${dto.username}" not found`);
      }

      inviteeId = user.id;
      inviteeEmail = user.email;

      const alreadyMember = team.members.find((m) => m.userId === user.id);
      if (alreadyMember) {
        throw new ConflictException('User is already a member of this team');
      }

      const existingMembership = await this.prisma.teamMember.findFirst({
        where: {
          userId: user.id,
          team: { hackathonId: team.hackathonId },
        },
      });

      if (existingMembership) {
        throw new BadRequestException(
          'User is already in another team in this hackathon',
        );
      }

      const existingInvite = team.invitations.find(
        (i) => i.inviteeId === user.id && i.status === 'PENDING',
      );

      if (existingInvite) {
        throw new ConflictException('Invitation already sent to this user');
      }
    } else if (dto.email) {
      inviteeEmail = dto.email;

      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (user) {
        inviteeId = user.id;

        const alreadyMember = team.members.find((m) => m.userId === user.id);
        if (alreadyMember) {
          throw new ConflictException('User is already a member of this team');
        }
      }

      const existingInvite = team.invitations.find(
        (i) => i.email === dto.email && i.status === 'PENDING',
      );

      if (existingInvite) {
        throw new ConflictException('Invitation already sent to this email');
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await this.prisma.teamInvitation.create({
      data: {
        teamId: dto.teamId,
        inviterId,
        inviteeId,
        email: inviteeEmail,
        expiresAt,
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.activityLogsService.log({
      userId: inviterId,
      hackathonId: team.hackathonId,
      action: 'TEAM_INVITATION_SENT',
      entity: 'TeamInvitation',
      entityId: invitation.id,
      metadata: {
        teamName: team.name,
        inviteeEmail: inviteeEmail,
        inviteeId: inviteeId,
      },
    });

    this.logger.log(`Invitation sent: ${inviterId} -> ${inviteeEmail} for team ${team.name}`);
    return invitation;
  }

  async accept(invitationId: string, userId: string) {
    await this.expireStale();

    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            hackathon: true,
            members: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException('This invitation was not sent to you');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(`Invitation is already ${invitation.status.toLowerCase()}`);
    }

    if (new Date() > invitation.expiresAt) {
      await this.prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.team.isLocked) {
      throw new BadRequestException('Team is locked');
    }

    if (invitation.team.isDisqualified) {
      throw new BadRequestException('Team is disqualified');
    }

    if (invitation.team.members.length >= invitation.team.hackathon.maxTeamSize) {
      throw new BadRequestException(
        `Team is full (max ${invitation.team.hackathon.maxTeamSize} members)`,
      );
    }

    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: { hackathonId: invitation.team.hackathonId },
      },
    });

    if (existingMembership) {
      throw new BadRequestException('You are already in another team in this hackathon');
    }

    const [updatedInvitation] = await this.prisma.$transaction([
      this.prisma.teamInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      }),
      this.prisma.teamMember.create({
        data: {
          teamId: invitation.teamId,
          userId,
          role: 'MEMBER',
        },
      }),
    ]);

    await this.activityLogsService.log({
      userId,
      hackathonId: invitation.team.hackathonId,
      action: 'TEAM_INVITATION_ACCEPTED',
      entity: 'Team',
      entityId: invitation.teamId,
      metadata: {
        teamName: invitation.team.name,
        invitationId,
      },
    });

    this.logger.log(`User ${userId} accepted invitation to team ${invitation.team.name}`);
    return updatedInvitation;
  }

  async reject(invitationId: string, userId: string) {
    await this.expireStale();

    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException('This invitation was not sent to you');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(`Invitation is already ${invitation.status.toLowerCase()}`);
    }

    const updated = await this.prisma.teamInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    this.logger.log(`User ${userId} rejected invitation to team ${invitation.teamId}`);
    return updated;
  }

  async cancel(invitationId: string, userId: string) {
    await this.expireStale();

    const invitation = await this.prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: { team: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.team.ownerId !== userId) {
      throw new ForbiddenException('Only the team owner can cancel invitations');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Can only cancel pending invitations');
    }

    await this.prisma.teamInvitation.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation cancelled' };
  }

  async getPendingForUser(userId: string) {
    await this.expireStale();

    const invitations = await this.prisma.teamInvitation.findMany({
      where: {
        inviteeId: userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            hackathon: {
              select: { id: true, title: true, slug: true },
            },
            owner: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            _count: { select: { members: true } },
          },
        },
        inviter: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }

  async getPendingForTeam(teamId: string, userId: string) {
    await this.expireStale();

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Only the team owner can view pending invitations');
      }
    }

    const invitations = await this.prisma.teamInvitation.findMany({
      where: {
        teamId,
        status: 'PENDING',
      },
      include: {
        inviter: {
          select: { id: true, name: true, email: true },
        },
        invitee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations;
  }
}
