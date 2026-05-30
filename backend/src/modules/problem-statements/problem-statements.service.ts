import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateProblemStatementDto } from './dto/create-problem-statement.dto';
import { UpdateProblemStatementDto } from './dto/update-problem-statement.dto';

@Injectable()
export class ProblemStatementsService {
  private readonly logger = new Logger(ProblemStatementsService.name);

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
    return this.prisma.problemStatement.findMany({
      where: { hackathonId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(hackathonId: string, dto: CreateProblemStatementDto, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const problemStatement = await this.prisma.problemStatement.create({
      data: {
        hackathonId,
        title: dto.title,
        description: dto.description,
        difficulty: dto.difficulty ?? 'MEDIUM',
        technologies: dto.technologies ?? [],
        resources: dto.resources ?? [],
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'PROBLEM_STATEMENT_CREATED',
      entity: 'ProblemStatement',
      entityId: problemStatement.id,
      metadata: { title: dto.title, difficulty: dto.difficulty },
    });

    this.logger.log(`Problem statement created for hackathon ${hackathonId} by user ${userId}`);
    return problemStatement;
  }

  async update(hackathonId: string, id: string, dto: UpdateProblemStatementDto, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const problemStatement = await this.prisma.problemStatement.findFirst({
      where: { id, hackathonId },
    });
    if (!problemStatement) throw new NotFoundException('Problem statement not found');

    const updated = await this.prisma.problemStatement.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        difficulty: dto.difficulty,
        technologies: dto.technologies,
        resources: dto.resources,
        isActive: dto.isActive,
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'PROBLEM_STATEMENT_UPDATED',
      entity: 'ProblemStatement',
      entityId: id,
      metadata: dto,
    });

    this.logger.log(`Problem statement ${id} updated for hackathon ${hackathonId}`);
    return updated;
  }

  async remove(hackathonId: string, id: string, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const problemStatement = await this.prisma.problemStatement.findFirst({
      where: { id, hackathonId },
    });
    if (!problemStatement) throw new NotFoundException('Problem statement not found');

    await this.prisma.problemStatement.delete({ where: { id } });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'PROBLEM_STATEMENT_DELETED',
      entity: 'ProblemStatement',
      entityId: id,
      metadata: { title: problemStatement.title },
    });

    this.logger.log(`Problem statement ${id} deleted from hackathon ${hackathonId}`);
    return { message: 'Problem statement deleted successfully' };
  }
}
