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
import { ProblemStatementsService } from './problem-statements.service';
import { CreateProblemStatementDto } from './dto/create-problem-statement.dto';
import { UpdateProblemStatementDto } from './dto/update-problem-statement.dto';

@ApiTags('Problem Statements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hackathons/:hackathonId/problem-statements')
export class ProblemStatementsController {
  constructor(private readonly problemStatementsService: ProblemStatementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all problem statements for a hackathon' })
  findAll(@Param('hackathonId') hackathonId: string) {
    return this.problemStatementsService.findAll(hackathonId);
  }

  @Post()
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a problem statement (organizer/admin)' })
  create(
    @Param('hackathonId') hackathonId: string,
    @Body() dto: CreateProblemStatementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.problemStatementsService.create(hackathonId, dto, userId);
  }

  @Patch(':id')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a problem statement (organizer/admin)' })
  update(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProblemStatementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.problemStatementsService.update(hackathonId, id, dto, userId);
  }

  @Delete(':id')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a problem statement (organizer/admin)' })
  remove(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.problemStatementsService.remove(hackathonId, id, userId);
  }
}
