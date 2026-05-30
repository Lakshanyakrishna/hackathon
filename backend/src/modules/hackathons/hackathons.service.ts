import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import * as slugify from 'slugify';

@Injectable()
export class HackathonsService {
  private readonly logger = new Logger(HackathonsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto, filters?: { status?: string; mode?: string }) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.mode) {
      where.mode = filters.mode;
    }

    const [data, total] = await Promise.all([
      this.prisma.hackathon.findMany({
        where,
        include: {
          organizer: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          _count: {
            select: {
              teams: true,
              registrations: true,
              submissions: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.hackathon.count({ where }),
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
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        stages: { orderBy: { order: 'asc' } },
        rules: { where: { isActive: true }, orderBy: { order: 'asc' } },
        prizes: { where: { isActive: true }, orderBy: { position: 'asc' } },
        problemStatements: { where: { isActive: true } },
        announcements: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            teams: true,
            registrations: true,
            submissions: true,
          },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    return hackathon;
  }

  async findBySlug(slug: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { slug },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        stages: { orderBy: { order: 'asc' } },
        rules: { where: { isActive: true }, orderBy: { order: 'asc' } },
        prizes: { where: { isActive: true }, orderBy: { position: 'asc' } },
        problemStatements: { where: { isActive: true } },
        announcements: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            teams: true,
            registrations: true,
            submissions: true,
          },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    return hackathon;
  }

  async create(dto: CreateHackathonDto, organizerId: string) {
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    if (new Date(dto.registrationDeadline) >= new Date(dto.startDate)) {
      throw new BadRequestException('Registration deadline must be before start date');
    }

    let slug = slugify.default(dto.title, { lower: true, strict: true });

    const existing = await this.prisma.hackathon.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const hackathon = await this.prisma.hackathon.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        banner: dto.banner,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        registrationFee: dto.registrationFee || 0,
        registrationDeadline: new Date(dto.registrationDeadline),
        registrationMode: dto.registrationMode || 'OPEN',
        minTeamSize: dto.minTeamSize || 1,
        maxTeamSize: dto.maxTeamSize || 4,
        mode: dto.mode || 'ONLINE',
        meetingLink: dto.meetingLink,
        organizerId,
        stages: dto.stages
          ? {
              create: dto.stages.map((stage) => ({
                name: stage.name,
                description: stage.description,
                order: stage.order,
                startDate: stage.startDate ? new Date(stage.startDate) : null,
                endDate: stage.endDate ? new Date(stage.endDate) : null,
              })),
            }
          : undefined,
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
        organizer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    this.logger.log(`Hackathon created: ${hackathon.title} by ${organizerId}`);
    return hackathon;
  }

  async update(id: string, dto: UpdateHackathonDto, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id } });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.organizerId !== userId && userId !== hackathon.organizerId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Not authorized to update this hackathon');
      }
    }

    if (dto.title && dto.title !== hackathon.title) {
      let slug = slugify.default(dto.title, { lower: true, strict: true });
      const existing = await this.prisma.hackathon.findUnique({ where: { slug } });
      if (existing && existing.id !== id) {
        slug = `${slug}-${Date.now()}`;
      }
      (dto as any).slug = slug;
    }

    const updateData: any = { ...dto };

    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }
    if (dto.registrationDeadline) {
      updateData.registrationDeadline = new Date(dto.registrationDeadline);
    }

    if (dto.stages) {
      await this.prisma.stageConfig.deleteMany({ where: { hackathonId: id } });
      await this.prisma.stageConfig.createMany({
        data: dto.stages.map((stage) => ({
          hackathonId: id,
          name: stage.name,
          description: stage.description,
          order: stage.order,
          startDate: stage.startDate ? new Date(stage.startDate) : null,
          endDate: stage.endDate ? new Date(stage.endDate) : null,
        })),
      });
    }
    delete updateData.stages;

    const updated = await this.prisma.hackathon.update({
      where: { id },
      data: updateData,
      include: {
        stages: { orderBy: { order: 'asc' } },
        organizer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    this.logger.log(`Hackathon updated: ${updated.title}`);
    return updated;
  }

  async remove(id: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id } });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.organizerId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('Not authorized to delete this hackathon');
      }
    }

    await this.prisma.hackathon.delete({ where: { id } });

    this.logger.log(`Hackathon deleted: ${hackathon.title}`);
    return { message: 'Hackathon deleted successfully' };
  }

  async publish(id: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id } });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can publish this hackathon');
    }

    if (hackathon.status !== 'DRAFT') {
      throw new BadRequestException('Only draft hackathons can be published');
    }

    const updated = await this.prisma.hackathon.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    this.logger.log(`Hackathon published: ${updated.title}`);
    return updated;
  }

  async archive(id: string, userId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({ where: { id } });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    if (hackathon.organizerId !== userId) {
      throw new ForbiddenException('Only the organizer can archive this hackathon');
    }

    const updated = await this.prisma.hackathon.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    this.logger.log(`Hackathon archived: ${updated.title}`);
    return updated;
  }
}
