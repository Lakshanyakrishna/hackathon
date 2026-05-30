import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

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
    return this.prisma.announcement.findMany({
      where: { hackathonId },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async create(hackathonId: string, dto: CreateAnnouncementDto, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const announcement = await this.prisma.announcement.create({
      data: {
        hackathonId,
        title: dto.title,
        content: dto.content,
        isPinned: dto.isPinned ?? false,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'ANNOUNCEMENT_CREATED',
      entity: 'Announcement',
      entityId: announcement.id,
      metadata: { title: dto.title, isPinned: dto.isPinned },
    });

    this.logger.log(`Announcement created for hackathon ${hackathonId} by user ${userId}`);
    return announcement;
  }

  async update(hackathonId: string, id: string, dto: UpdateAnnouncementDto, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const announcement = await this.prisma.announcement.findFirst({
      where: { id, hackathonId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: dto.title,
        content: dto.content,
        isPinned: dto.isPinned,
        isActive: dto.isActive,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
    });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'ANNOUNCEMENT_UPDATED',
      entity: 'Announcement',
      entityId: id,
      metadata: dto,
    });

    this.logger.log(`Announcement ${id} updated for hackathon ${hackathonId}`);
    return updated;
  }

  async remove(hackathonId: string, id: string, userId: string) {
    await this.validateHackathonOwnership(hackathonId, userId);

    const announcement = await this.prisma.announcement.findFirst({
      where: { id, hackathonId },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');

    await this.prisma.announcement.delete({ where: { id } });

    await this.activityLogsService.log({
      userId,
      hackathonId,
      action: 'ANNOUNCEMENT_DELETED',
      entity: 'Announcement',
      entityId: id,
      metadata: { title: announcement.title },
    });

    this.logger.log(`Announcement ${id} deleted from hackathon ${hackathonId}`);
    return { message: 'Announcement deleted successfully' };
  }
}
