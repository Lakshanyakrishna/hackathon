import { Test, TestingModule } from '@nestjs/testing';
import { TeamInvitationsService } from './team-invitations.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TeamInvitationsService', () => {
  let service: TeamInvitationsService;
  let prisma: PrismaService;

  const mockPrisma = {
    teamInvitation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
    teamMember: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockActivityLogs = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamInvitationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ActivityLogsService, useValue: mockActivityLogs },
      ],
    }).compile();

    service = module.get<TeamInvitationsService>(TeamInvitationsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('expireStale', () => {
    it('should mark expired invitations as EXPIRED', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.expireStale();

      expect(result).toBe(3);
      expect(mockPrisma.teamInvitation.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          expiresAt: { lt: expect.any(Date) },
        },
        data: { status: 'EXPIRED' },
      });
    });
  });

  describe('send', () => {
    const validDto = { teamId: 'team-1', username: 'john_doe' };

    it('should send invitation by username', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        ownerId: 'owner-1',
        isLocked: false,
        isDisqualified: false,
        invitations: [],
        members: [],
        hackathon: { maxTeamSize: 4 },
      });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'invitee-1', email: 'john@example.com', username: 'john_doe' });
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);
      mockPrisma.teamInvitation.create.mockResolvedValue({
        id: 'invite-1',
        team: { name: 'Team A' },
        inviter: {},
      });

      const result = await service.send(validDto, 'owner-1');

      expect(result).toBeDefined();
      expect(mockActivityLogs.log).toHaveBeenCalled();
    });

    it('should throw if neither email nor username provided', async () => {
      await expect(service.send({ teamId: 'team-1' }, 'owner-1')).rejects.toThrow(
        'Either email or username is required',
      );
    });

    it('should throw if not team owner', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        ownerId: 'owner-1',
        invitations: [],
        members: [],
        hackathon: { maxTeamSize: 4 },
      });

      await expect(service.send(validDto, 'not-owner')).rejects.toThrow(
        'Only the team owner',
      );
    });

    it('should throw if team is locked', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        ownerId: 'owner-1',
        isLocked: true,
        invitations: [],
        members: [],
        hackathon: {},
      });

      await expect(service.send(validDto, 'owner-1')).rejects.toThrow('locked');
    });

    it('should throw if max pending reached', async () => {
      const pendingInvites = Array(20).fill({ status: 'PENDING' });
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        ownerId: 'owner-1',
        isLocked: false,
        isDisqualified: false,
        invitations: pendingInvites,
        members: [{ userId: 'owner-1' }],
        hackathon: { maxTeamSize: 4 },
      });

      await expect(service.send(validDto, 'owner-1')).rejects.toThrow(
        'Maximum 20 pending invitations',
      );
    });

    it('should throw if team is full', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        ownerId: 'owner-1',
        isLocked: false,
        isDisqualified: false,
        invitations: [],
        members: [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }, { userId: 'd' }],
        hackathon: { maxTeamSize: 4 },
      });

      await expect(service.send(validDto, 'owner-1')).rejects.toThrow('full');
    });

    it('should throw if username not found', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        ownerId: 'owner-1',
        isLocked: false,
        isDisqualified: false,
        invitations: [],
        members: [],
        hackathon: { maxTeamSize: 4 },
      });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.send(validDto, 'owner-1')).rejects.toThrow('not found');
    });
  });

  describe('accept', () => {
    it('should accept invitation and create team member', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'PENDING',
        inviteeId: 'user-1',
        expiresAt: new Date(Date.now() + 86400000),
        teamId: 'team-1',
        team: {
          isLocked: false,
          isDisqualified: false,
          hackathon: { maxTeamSize: 4, id: 'hackathon-1' },
          members: [{ userId: 'owner' }],
        },
      });
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue([
        { id: 'invite-1', status: 'ACCEPTED' },
        { id: 'member-1' },
      ]);

      const result = await service.accept('invite-1', 'user-1');

      expect(result).toBeDefined();
      expect(mockActivityLogs.log).toHaveBeenCalled();
    });

    it('should throw if invitation not for this user', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        inviteeId: 'other-user',
      });

      await expect(service.accept('invite-1', 'user-1')).rejects.toThrow(
        'not sent to you',
      );
    });

    it('should throw if invitation expired on accept', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'PENDING',
        inviteeId: 'user-1',
        expiresAt: new Date(Date.now() - 86400000),
        teamId: 'team-1',
        team: { members: [] },
      });

      await expect(service.accept('invite-1', 'user-1')).rejects.toThrow('expired');
    });
  });

  describe('reject', () => {
    it('should reject invitation', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.teamInvitation.findUnique.mockResolvedValue({
        id: 'invite-1',
        status: 'PENDING',
        inviteeId: 'user-1',
        teamId: 'team-1',
      });
      mockPrisma.teamInvitation.update.mockResolvedValue({
        id: 'invite-1',
        status: 'REJECTED',
      });

      const result = await service.reject('invite-1', 'user-1');

      expect(result.status).toBe('REJECTED');
    });
  });

  describe('getPendingForUser', () => {
    it('should return pending invitations for user', async () => {
      mockPrisma.teamInvitation.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.teamInvitation.findMany.mockResolvedValue([
        { id: 'invite-1', team: {}, inviter: {} },
      ]);

      const result = await service.getPendingForUser('user-1');

      expect(result).toHaveLength(1);
    });
  });
});
