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
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ReviewRegistrationDto } from './dto/review-registration.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Registrations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @ApiOperation({ summary: 'Register for a hackathon' })
  async register(
    @Body() dto: CreateRegistrationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationsService.register(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all registrations (filtered)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'hackathonId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query() pagination: PaginationDto,
    @Query('hackathonId') hackathonId?: string,
    @Query('status') status?: string,
  ) {
    if (userRole === 'PARTICIPANT') {
      return this.registrationsService.findAll(pagination, { userId });
    }

    if (userRole === 'ORGANIZER' && !hackathonId) {
      return this.registrationsService.findAllByOrganizer(pagination, userId);
    }

    if (userRole === 'ORGANIZER' && hackathonId) {
      return this.registrationsService.findAllByOwnedHackathon(pagination, hackathonId, userId);
    }

    return this.registrationsService.findAll(pagination, {
      hackathonId,
      status,
    });
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my registrations' })
  async findByUser(@CurrentUser('id') userId: string) {
    return this.registrationsService.findByUser(userId);
  }

  @Get('stats/:hackathonId')
  @ApiOperation({ summary: 'Get registration stats for a hackathon' })
  async getStats(@Param('hackathonId') hackathonId: string) {
    return this.registrationsService.getStats(hackathonId);
  }

  @Get('pending/:hackathonId')
  @ApiOperation({ summary: 'Get pending registrations for a hackathon (organizer)' })
  async getPendingForHackathon(
    @Param('hackathonId') hackathonId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationsService.getPendingForHackathon(hackathonId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration by ID' })
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.registrationsService.findById(id, userId, userRole);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a registration (organizer)' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ReviewRegistrationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationsService.approve(id, userId, dto);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a registration (organizer)' })
  async reject(
    @Param('id') id: string,
    @Body() dto: ReviewRegistrationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationsService.reject(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel my registration' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.registrationsService.cancel(id, userId);
  }
}
