import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ScoresService } from './scores.service';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';

@ApiTags('Scores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a score for a team (organizer/admin)' })
  create(
    @Body() dto: CreateScoreDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.scoresService.create(dto, userId);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a score (organizer/admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScoreDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.scoresService.update(id, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List scores (role-filtered)' })
  @ApiQuery({ name: 'hackathonId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'stageId', required: false })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
    @Query('hackathonId') hackathonId?: string,
    @Query('teamId') teamId?: string,
    @Query('stageId') stageId?: string,
  ) {
    return this.scoresService.findAll(userId, userRole, {
      hackathonId, teamId, stageId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a score by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.scoresService.findOne(id, userId, userRole);
  }

  @Get('stage/:stageId')
  @ApiOperation({ summary: 'Get all scores for a stage' })
  getStageScores(
    @Param('stageId') stageId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: string,
  ) {
    return this.scoresService.getStageScores(stageId, userId, userRole);
  }
}
