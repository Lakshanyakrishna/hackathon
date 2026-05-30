import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get()
  @ApiOperation({ summary: 'Upload module status' })
  getStatus() {
    return this.uploadService.getStatus();
  }
}
