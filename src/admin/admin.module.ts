import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { AdminAuthController } from './admin.auth.controller';
import { AdminAuthService } from './admin.auth.service';
import { AdminCategoriesController, CategoriesController } from './admin.categories.controller';
import { AdminCategoriesService } from './admin.categories.service';
import { AdminDashboardController } from './admin.dashboard.controller';
import { AdminDashboardService } from './admin.dashboard.service';
import { AdminGuard } from './admin.guard';
import { AdminInvitationsController } from './admin.invitations.controller';
import { AdminInvitationsService } from './admin.invitations.service';
import { AdminNotificationsController } from './admin.notifications.controller';
import { AdminNotificationsService } from './admin.notifications.service';
import { AdminReportsController } from './admin.reports.controller';
import { AdminReportsService } from './admin.reports.service';
import { AdminStatisticsController } from './admin.statistics.controller';
import { AdminStatisticsService } from './admin.statistics.service';
import { AdminUsersController } from './admin.users.controller';
import { AdminUsersService } from './admin.users.service';

@Module({
  imports: [DatabaseModule, AuthModule, ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])],
  controllers: [
    AdminAuthController,
    AdminDashboardController,
    AdminUsersController,
    AdminReportsController,
    AdminNotificationsController,
    CategoriesController,
    AdminCategoriesController,
    AdminStatisticsController,
    AdminInvitationsController,
  ],
  providers: [
    AdminAuthService,
    AdminGuard,
    AdminDashboardService,
    AdminUsersService,
    AdminReportsService,
    AdminNotificationsService,
    AdminCategoriesService,
    AdminStatisticsService,
    AdminInvitationsService,
  ],
})
export class AdminModule {}