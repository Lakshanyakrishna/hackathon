import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class TeamRef {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

class HackathonRef {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() slug: string;
}

class StageRef {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() order: number;
  @ApiPropertyOptional() requirements?: any;
  @ApiPropertyOptional() evaluationCriteria?: any;
  @ApiPropertyOptional() promotionRule?: any;
  @ApiPropertyOptional() startDate?: Date;
  @ApiPropertyOptional() endDate?: Date;
}

export class SubmissionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() teamId: string;
  @ApiProperty() hackathonId: string;
  @ApiProperty() stageId: string;
  @ApiProperty() version: number;
  @ApiPropertyOptional() data?: any;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() submittedAt?: Date;
  @ApiPropertyOptional() submittedBy?: string;
  @ApiPropertyOptional() previousVersionId?: string;
  @ApiPropertyOptional() reviewedBy?: string;
  @ApiPropertyOptional() reviewNotes?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiProperty() team: TeamRef;
  @ApiProperty() hackathon: HackathonRef;
  @ApiProperty() stage: StageRef;
}
