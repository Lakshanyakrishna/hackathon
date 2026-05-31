import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
import { StagesService } from './stages.service';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';

@ApiTags('Stages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hackathons/:hackathonId/stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Post()
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new stage (organizer/admin)' })
  create(
    @Param('hackathonId') hackathonId: string,
    @Body() dto: CreateStageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stagesService.create(hackathonId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all stages for a hackathon' })
  findAll(@Param('hackathonId') hackathonId: string) {
    return this.stagesService.findAll(hackathonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single stage by ID' })
  findOne(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
  ) {
    return this.stagesService.findOne(hackathonId, id);
  }

  @Patch(':id')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a stage (organizer/admin)' })
  update(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stagesService.update(hackathonId, id, dto, userId);
  }

  @Delete(':id')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a stage (organizer/admin)' })
  remove(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.stagesService.delete(hackathonId, id, userId);
  }

  @Put('reorder')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reorder stages (organizer/admin)' })
  reorder(
    @Param('hackathonId') hackathonId: string,
    @Body() dto: ReorderStagesDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.stagesService.reorder(hackathonId, dto, userId);
  }
}
