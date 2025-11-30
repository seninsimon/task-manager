import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CompanyModule } from './company/company.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost:27017/taskScheduler'),
    UsersModule, AuthModule, ProjectsModule, TasksModule, CompanyModule, NotificationsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
