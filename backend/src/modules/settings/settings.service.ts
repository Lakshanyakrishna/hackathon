import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  getStatus() {
    return { message: 'Settings module ready' };
  }
}
