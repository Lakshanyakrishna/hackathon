import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface LogEntry {
  userId: string;
  hackathonId?: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class ActivityLogsService {
  private readonly logger = new Logger(ActivityLogsService.name);

  constructor(private prisma: PrismaService) {}

  async log(entry: LogEntry) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: entry.userId,
          hackathonId: entry.hackathonId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          metadata: entry.metadata || {},
          ipAddress: entry.ipAddress,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log activity: ${error.message}`);
    }
  }

  async findByHackathon(hackathonId: string, page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { hackathonId },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where: { hackathonId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByUser(userId: string, page = 1, limit = 50) {
    const [data, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activityLog.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  getStatus() {
    return { message: 'Activity logs module ready' };
  }
}
