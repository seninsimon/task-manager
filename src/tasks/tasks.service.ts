import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Task, TaskDocument } from "./schemas/task.schema";
import { Project , ProjectDocument  } from "src/projects/shemas/project.schema";

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  /* ---------------------------------------------
   * Get all tasks for a project
   * ---------------------------------------------*/
  async getTasksForProject(projectId: string) {
    try {
      // validate projectId
      if (!Types.ObjectId.isValid(projectId)) {
        throw new BadRequestException("Invalid projectId");
      }
      const projectObjectId = new Types.ObjectId(projectId);

      // optional: make sure project exists
      const project = await this.projectModel.findById(projectObjectId).lean();
      if (!project) throw new NotFoundException("Project not found");

      // find tasks for that project
      const tasks = await this.taskModel
        .find({ projectId: projectObjectId })
        .populate("assignee", "name email")
        .lean();

      return {
            
         tasks,
      };
    } catch (err) {
      // convert unknown errors to HTTP error for clarity
      if (err.status && err.message) throw err;
      throw new InternalServerErrorException("Failed to fetch tasks");
    }
  }

  /* ---------------------------------------------
   * Create Task – only project owner or senior can do this
   * ---------------------------------------------*/
  async createTask(projectId: string, userId: string, body: any) {
    try {
      if (!Types.ObjectId.isValid(projectId)) {
        throw new BadRequestException("Invalid projectId");
      }
      const projectObjectId = new Types.ObjectId(projectId);

      const project = await this.projectModel.findById(projectObjectId);
      if (!project) throw new NotFoundException("Project not found");

      // Permission check: owner OR senior role from company
      // project.owner may be ObjectId or populated object
      const ownerId = (project.owner && project.owner._id) ? project.owner._id.toString() : project.owner?.toString();

      if (ownerId !== userId) {
        // allow seniors too — check user's role in project's company
        // NOTE: this requires the caller (controller) to have user.company and role;
        // for safety we can only allow owner here, or expand this check by fetching the user model.
        throw new ForbiddenException("Only project owner can create tasks");
      }

      // ensure assignee is valid ObjectId or null
      const assignee = body.assignee && Types.ObjectId.isValid(body.assignee)
        ? new Types.ObjectId(body.assignee)
        : null;

      // IMPORTANT: Task schema requires company — set it from project (if exists)
      const companyId = project.company ?? null;
      if (!companyId) {
        // If your project hasn't been assigned a company (shouldn't happen), throw
        throw new InternalServerErrorException("Project missing company reference");
      }

      const task = await this.taskModel.create({
        title: body.title,
        description: body.description || "",
        dueDate: body.dueDate || null,
        assignee,
        branchName: body.branchName || "",
        progress: "not_started",
        projectId: projectObjectId,
        todos: [],
        company: companyId, // <-- ensure company is saved
      });

      return {
        success: true,
        statusCode: 201,
        message: "Task created successfully",
        data: task,
      };
    } catch (err) {
      if (err.status && err.message) throw err;
      // if it's a mongoose validation error you may want to surface the message
      throw new InternalServerErrorException("Failed to create task");
    }
  }

  /* ---------------------------------------------
   * Update Task (branch, progress, assignee, etc.)
   * ---------------------------------------------*/
  async updateTask(taskId: string, updates: any) {
    try {
      if (!Types.ObjectId.isValid(taskId)) throw new BadRequestException("Invalid taskId");
      const updated = await this.taskModel.findByIdAndUpdate(
        taskId,
        updates,
        { new: true },
      );

      if (!updated) throw new NotFoundException("Task not found");

      return {
        success: true,
        statusCode: 200,
        data: updated,
      };
    } catch (err) {
      if (err.status && err.message) throw err;
      throw new InternalServerErrorException("Failed to update task");
    }
  }

  /* ---------------------------------------------
   * Add Todo
   * ---------------------------------------------*/
  async addTodo(taskId: string, text: string) {
    try {
      if (!Types.ObjectId.isValid(taskId)) throw new BadRequestException("Invalid taskId");
      const task = await this.taskModel.findById(taskId);
      if (!task) throw new NotFoundException("Task not found");

      task.todos.push({
        _id: new Types.ObjectId(),
        text,
        done: false,
      });

      await task.save();

      return {
        success: true,
        statusCode: 201,
        data: task,
      };
    } catch (err) {
      if (err.status && err.message) throw err;
      throw new InternalServerErrorException("Failed to add todo");
    }
  }

  /* ---------------------------------------------
   * Toggle Todo
   * ---------------------------------------------*/
  async toggleTodo(taskId: string, todoId: string, done: boolean) {
    try {
      if (!Types.ObjectId.isValid(taskId) || !Types.ObjectId.isValid(todoId)) {
        throw new BadRequestException("Invalid id(s)");
      }

      const task = await this.taskModel.findOneAndUpdate(
        { _id: taskId, "todos._id": todoId },
        { $set: { "todos.$.done": done } },
        { new: true },
      );

      if (!task) throw new NotFoundException("Task or Todo not found");

      return {
        success: true,
        statusCode: 200,
        data: task,
      };
    } catch (err) {
      if (err.status && err.message) throw err;
      throw new InternalServerErrorException("Failed to toggle todo");
    }
  }

  /* ---------------------------------------------
   * Create PR (placeholder)
   * ---------------------------------------------*/
  async createPR(taskId: string) {
    return {
      success: true,
      statusCode: 200,
      message:
        "PR creation triggered (placeholder). Integrate GitHub/GitLab API later.",
    };
  }
}
