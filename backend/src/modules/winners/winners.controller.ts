import {
  Controller,
  Get,
  Post,
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
import { WinnersService } from './winners.service';
import { CreateWinnerDto } from './dto/create-winner.dto';

@ApiTags('Winners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hackathons/:hackathonId/winners')
export class WinnersController {
  constructor(private readonly winnersService: WinnersService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Declare a winner with award title and optional prize' })
  create(
    @Param('hackathonId') hackathonId: string,
    @Body() dto: CreateWinnerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.winnersService.create(hackathonId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all winners for a hackathon' })
  findAll(@Param('hackathonId') hackathonId: string) {
    return this.winnersService.findAll(hackathonId);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Remove a winner' })
  remove(
    @Param('hackathonId') hackathonId: string,
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.winnersService.remove(hackathonId, id, userId);
  }
}
