import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
  getStatus() {
    return { message: 'Dashboard module ready' };
  }
}
