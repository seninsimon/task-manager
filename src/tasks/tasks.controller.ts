import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Get tasks for a project
  @Get("/projects/:projectId/tasks")
  getTasks(@Param("projectId") projectId: string) {
    return this.tasksService.getTasksForProject(projectId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/projects/:projectId/tasks")
  createTask(
    @Param("projectId") projectId: string,
    @Req() req,
    @Body() body: any,
  ) {
    const userId = req.user.userId; // logged-in user
    return this.tasksService.createTask(projectId, userId, body);
}


  // Update task (branch, progress, assignee, dueDate)
  @Patch("/tasks/:taskId")
  updateTask(
    @Param("taskId") taskId: string,
    @Body() updates: any,
  ) {
    return this.tasksService.updateTask(taskId, updates);
  }

  // Add todo
  @Post("/tasks/:taskId/todos")
  addTodo(
    @Param("taskId") taskId: string,
    @Body("text") text: string,
  ) {
    return this.tasksService.addTodo(taskId, text);
  }

  // Toggle todo
  @Patch("/tasks/:taskId/todos/:todoId")
  toggleTodo(
    @Param("taskId") taskId: string,
    @Param("todoId") todoId: string,
    @Body("done") done: boolean,
  ) {
    return this.tasksService.toggleTodo(taskId, todoId, done);
  }

  // PR creation placeholder
  @Post("/tasks/:taskId/create-pr")
  createPR(@Param("taskId") taskId: string) {
    return this.tasksService.createPR(taskId);
  }
}
