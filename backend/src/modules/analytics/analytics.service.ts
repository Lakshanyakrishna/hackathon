import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getFunnel(hackathonId: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const [
      totalRegistrations,
      paidUsers,
      approvedRegistrations,
      teamsWithApproved,
      stages,
    ] = await Promise.all([
      this.prisma.registration.count({
        where: { hackathonId },
      }),
      this.prisma.payment.findMany({
        where: { hackathonId, status: 'SUCCESS' },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.registration.count({
        where: { hackathonId, status: 'APPROVED' },
      }),
      this.prisma.team.count({
        where: { hackathonId },
      }),
      this.prisma.stageConfig.findMany({
        where: { hackathonId },
        orderBy: { order: 'asc' },
        select: { id: true, name: true, order: true },
      }),
    ]);

    const paidRegistrations = paidUsers.length;

    const stageSubmissions = await Promise.all(
      stages.map((stage) =>
        this.prisma.submission.count({
          where: {
            stageId: stage.id,
            status: 'SUBMITTED',
          },
        }),
      ),
    );

    const funnel = [
      {
        stage: 'Registrations',
        count: totalRegistrations,
        percentage: 100,
      },
      {
        stage: 'Paid',
        count: paidRegistrations,
        percentage: totalRegistrations > 0
          ? Math.round((paidRegistrations / totalRegistrations) * 10000) / 100
          : 0,
      },
      {
        stage: 'Approved',
        count: approvedRegistrations,
        percentage: paidRegistrations > 0
          ? Math.round((approvedRegistrations / paidRegistrations) * 10000) / 100
          : totalRegistrations > 0
            ? Math.round((approvedRegistrations / totalRegistrations) * 10000) / 100
            : 0,
      },
    ];

    for (let i = 0; i < stages.length; i++) {
      const prevCount = i === 0 ? approvedRegistrations : stageSubmissions[i - 1];
      funnel.push({
        stage: `Submitted (${stages[i].name})`,
        count: stageSubmissions[i],
        percentage: prevCount > 0
          ? Math.round((stageSubmissions[i] / prevCount) * 10000) / 100
          : 0,
      });
    }

    return {
      hackathonId,
      hackathonTitle: hackathon.title,
      funnel,
      summary: {
        totalRegistrations,
        paidRegistrations,
        approvedRegistrations,
        teamsWithApproved,
        stagesCount: stages.length,
      },
    };
  }
}
