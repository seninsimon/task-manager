import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project , ProjectDocument } from './shemas/project.schema';
import { ProjectInvite , InviteStatus , ProjectInviteDocument } from './shemas/project-invite.schema';
import { Notification , NotificationDocument } from './shemas/notification.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import * as crypto from 'crypto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectInvite.name) private inviteModel: Model<ProjectInviteDocument>,
    @InjectModel(Notification.name) private notifModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  generateToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  async createProject(ownerId: string, dto: CreateProjectDto) {
    const inviteToken = this.generateToken();
     console.log(ownerId);
    const project = await this.projectModel.create({
      name: dto.name,
      repoUrl: dto.repoUrl,
      owner: ownerId,
      inviteToken,
    });

    // Handle members by email
    if (dto.emails && dto.emails.length > 0) {
      for (const email of dto.emails) {
        const user = await this.userModel.findOne({ email });

        if (user) {
          const individualToken = this.generateToken();

          await this.inviteModel.create({
            project: project._id,
            to: user._id,
            from: ownerId,
            inviteToken: individualToken,
            status: InviteStatus.PENDING,
          });

          await this.notifModel.create({
            user: user._id,
            title: 'Project Invitation',
            body: `You have been invited to join project: ${project.name}`,
            data: { projectId: project._id },
          });

          console.log(`(Email placeholder) Sent invite email to ${email}`);
        }
      }
    }

    return project;
  }

  async findUserByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async getUserProjects(userId: string) {
  return this.projectModel.find({
    $or: [
      { owner: userId },
      { members: userId }
    ]
  });
}
}
