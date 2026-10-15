import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserGuard } from '../auth/user.guard';
import { DatabaseModule } from '../database/database.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { EvidenceController, ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [DatabaseModule, ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])],
  controllers: [ReportsController, EvidenceController, CommunityController],
  providers: [ReportsService, CommunityService, UserGuard],
})
export class ReportsModule {}