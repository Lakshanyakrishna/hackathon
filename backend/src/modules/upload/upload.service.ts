import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  getStatus() {
    return { message: 'Upload module ready' };
  }
}
