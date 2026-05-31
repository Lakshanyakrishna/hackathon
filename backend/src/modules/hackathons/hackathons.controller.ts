import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Hackathons')
@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all hackathons' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'mode', required: false })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('mode') mode?: string,
  ) {
    return this.hackathonsService.findAll(pagination, { status, mode });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get hackathon by ID' })
  async findById(@Param('id') id: string) {
    return this.hackathonsService.findById(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get hackathon by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.hackathonsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new hackathon (admin)' })
  async create(
    @Body() dto: CreateHackathonDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update hackathon' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete hackathon' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.remove(id, userId);
  }

  @Patch(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish hackathon' })
  async publish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.publish(id, userId);
  }

  @Patch(':id/archive')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive hackathon' })
  async archive(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.hackathonsService.archive(id, userId);
  }
}
