import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrizesService } from './prizes.service';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { UpdatePrizeDto } from './dto/update-prize.dto';

@ApiTags('Prizes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hackathons/:hackathonId/prizes')
export class PrizesController {
  constructor(private readonly prizesService: PrizesService) {}

  @Get()
  @ApiOperation({ summary: 'List all prizes for a hackathon' })
  findAll(@Param('hackathonId') hackathonId: string) {
    return this.prizesService.findAll(hackathonId);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a prize (organizer/admin)' })
  create(
    @Param('hackathonId') hackathonId: string,
    @Body() dto: CreatePrizeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.prizesService.create(hackathonId, dto, userId);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a prize (organizer/admin)' })
  update(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePrizeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.prizesService.update(hackathonId, id, dto, userId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a prize (organizer/admin)' })
  remove(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.prizesService.remove(hackathonId, id, userId);
  }
}
