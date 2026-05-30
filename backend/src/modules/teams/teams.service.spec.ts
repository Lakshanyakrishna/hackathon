import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: PrismaService;
  let activityLogs: ActivityLogsService;

  const mockPrisma = {
    team: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    teamMember: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    hackathon: {
      findUnique: jest.fn(),
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
        TeamsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ActivityLogsService, useValue: mockActivityLogs },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    prisma = module.get<PrismaService>(PrismaService);
    activityLogs = module.get<ActivityLogsService>(ActivityLogsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated teams', async () => {
      const mockTeams = [{ id: '1', name: 'Team A', members: [] }];
      mockPrisma.team.findMany.mockResolvedValue(mockTeams);
      mockPrisma.team.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockTeams);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by hackathonId', async () => {
      mockPrisma.team.findMany.mockResolvedValue([]);
      mockPrisma.team.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10 }, 'hackathon-1');

      expect(mockPrisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ hackathonId: 'hackathon-1' }),
        }),
      );
    });

    it('should search by name', async () => {
      mockPrisma.team.findMany.mockResolvedValue([]);
      mockPrisma.team.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 10, search: 'code' });

      expect(mockPrisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'code' }) }),
            ]),
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return team if found', async () => {
      const mockTeam = {
        id: '1',
        name: 'Team A',
        owner: {},
        members: [],
        hackathon: {},
        _count: { submissions: 0, invitations: 0 },
      };
      mockPrisma.team.findUnique.mockResolvedValue(mockTeam);

      const result = await service.findById('1');

      expect(result).toEqual(mockTeam);
    });

    it('should throw NotFoundException if team not found', async () => {
      mockPrisma.team.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('Team not found');
    });
  });

  describe('create', () => {
    const createDto = { name: 'New Team', hackathonId: 'hackathon-1' };

    it('should create a team successfully', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue({
        id: 'hackathon-1',
        status: 'PUBLISHED',
        registrationDeadline: new Date(Date.now() + 86400000),
      });
      mockPrisma.team.findUnique.mockResolvedValue(null);
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);
      mockPrisma.team.create.mockResolvedValue({
        id: 'team-1',
        name: 'New Team',
        owner: {},
        members: [],
      });

      const result = await service.create(createDto, 'user-1');

      expect(result).toBeDefined();
      expect(mockActivityLogs.log).toHaveBeenCalled();
    });

    it('should throw if hackathon not found', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, 'user-1')).rejects.toThrow('Hackathon not found');
    });

    it('should throw if hackathon is not published', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue({
        id: 'hackathon-1',
        status: 'DRAFT',
      });

      await expect(service.create(createDto, 'user-1')).rejects.toThrow('unpublished');
    });

    it('should throw if registration deadline passed', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue({
        id: 'hackathon-1',
        status: 'PUBLISHED',
        registrationDeadline: new Date(Date.now() - 86400000),
      });

      await expect(service.create(createDto, 'user-1')).rejects.toThrow('deadline');
    });

    it('should throw if team name already exists in hackathon', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue({
        id: 'hackathon-1',
        status: 'PUBLISHED',
        registrationDeadline: new Date(Date.now() + 86400000),
      });
      mockPrisma.team.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create(createDto, 'user-1')).rejects.toThrow('already taken');
    });

    it('should throw if user is already in another team', async () => {
      mockPrisma.hackathon.findUnique.mockResolvedValue({
        id: 'hackathon-1',
        status: 'PUBLISHED',
        registrationDeadline: new Date(Date.now() + 86400000),
      });
      mockPrisma.team.findUnique.mockResolvedValue(null);
      mockPrisma.teamMember.findFirst.mockResolvedValue({
        team: { name: 'Other Team' },
      });

      await expect(service.create(createDto, 'user-1')).rejects.toThrow('already a member');
    });
  });

  describe('join', () => {
    it('should allow user to join team', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        isLocked: false,
        isDisqualified: false,
        hackathon: {
          maxTeamSize: 4,
          registrationDeadline: new Date(Date.now() + 86400000),
        },
        members: [{ userId: 'owner-1' }],
      });
      mockPrisma.teamMember.findFirst.mockResolvedValue(null);
      mockPrisma.teamMember.create.mockResolvedValue({ id: 'member-1', user: {} });

      const result = await service.join('team-1', 'user-2');

      expect(result).toBeDefined();
    });

    it('should throw if team is locked', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        isLocked: true,
      });

      await expect(service.join('team-1', 'user-2')).rejects.toThrow('locked');
    });

    it('should throw if team is full', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        isLocked: false,
        isDisqualified: false,
        hackathon: {
          maxTeamSize: 2,
          registrationDeadline: new Date(Date.now() + 86400000),
        },
        members: [{ userId: 'a' }, { userId: 'b' }],
      });

      await expect(service.join('team-1', 'user-2')).rejects.toThrow('full');
    });
  });

  describe('leave', () => {
    it('should allow member to leave', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        ownerId: 'owner-1',
        members: [{ id: 'membership-1', userId: 'user-2' }],
      });
      mockPrisma.teamMember.delete.mockResolvedValue({});

      const result = await service.leave('team-1', 'user-2');

      expect(result.message).toBe('Left team successfully');
    });

    it('should throw if owner tries to leave', async () => {
      mockPrisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        ownerId: 'owner-1',
        members: [{ userId: 'owner-1' }],
      });

      await expect(service.leave('team-1', 'owner-1')).rejects.toThrow('Team owner cannot leave');
    });
  });

  describe('findMyTeams', () => {
    it('should return teams for user', async () => {
      mockPrisma.teamMember.findMany.mockResolvedValue([
        { team: { id: 'team-1', name: 'My Team', hackathon: {}, _count: { members: 3 } } },
      ]);

      const result = await service.findMyTeams('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Team');
    });
  });
});
