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
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@ApiTags('Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hackathons/:hackathonId/rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all rules for a hackathon' })
  findAll(@Param('hackathonId') hackathonId: string) {
    return this.rulesService.findAll(hackathonId);
  }

  @Post()
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a rule (organizer/admin)' })
  create(
    @Param('hackathonId') hackathonId: string,
    @Body() dto: CreateRuleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rulesService.create(hackathonId, dto, userId);
  }

  @Patch(':id')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a rule (organizer/admin)' })
  update(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRuleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.rulesService.update(hackathonId, id, dto, userId);
  }

  @Delete(':id')
  @Roles('ORGANIZER', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Delete a rule (organizer/admin)' })
  remove(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.rulesService.remove(hackathonId, id, userId);
  }
}
