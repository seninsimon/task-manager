import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Project, ProjectSchema } from './shemas/project.schema';
import { ProjectInvite, ProjectInviteSchema } from './shemas/project-invite.schema';
import { Notification, NotificationSchema } from './shemas/notification.schema';

import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

import { InvitesService } from './invites.service';
import { InvitesController } from './invites.controller';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectInvite.name, schema: ProjectInviteSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [ProjectsController, InvitesController],
  providers: [ProjectsService, InvitesService],
})
export class ProjectsModule {}
