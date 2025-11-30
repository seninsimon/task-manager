import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Task, TaskSchema } from "./schemas/task.schema";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { UsersModule } from "../users/users.module";
import { ProjectsModule } from "../projects/projects.module";
import { Project, ProjectSchema } from "src/projects/shemas/project.schema";

@Module({
  imports: [
    UsersModule,
    ProjectsModule,
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }, { name: Project.name, schema: ProjectSchema  },]),
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule { }
