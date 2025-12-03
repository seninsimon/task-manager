import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './shemas/project.schema';
import { ProjectInvite, ProjectInviteSchema } from './shemas/project-invite.schema';
import { Notification, NotificationSchema } from '../notifications/schemas/notification.schema';

import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';

import { UsersModule } from '../users/users.module';
import { Company, CompanySchema } from 'src/company/schema/company.schema';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectInvite.name, schema: ProjectInviteSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ProjectsController, InvitesController],
  providers: [ProjectsService, InvitesService],
})
export class ProjectsModule { }
