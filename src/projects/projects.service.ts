import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";

import { Project, ProjectDocument } from "./shemas/project.schema";
import {
  ProjectInvite,
  InviteStatus,
  ProjectInviteDocument,
} from "./shemas/project-invite.schema";
import {
  Notification,
  NotificationDocument,
} from "../notifications/schemas/notification.schema";
import { User, UserDocument } from "src/users/schemas/user.schema";

import { CreateProjectDto } from "./dto/create-project.dto";
import * as crypto from "crypto";
import { Company, CompanyDocument } from "src/company/schema/company.schema";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,

    @InjectModel(ProjectInvite.name)
    private inviteModel: Model<ProjectInviteDocument>,

    @InjectModel(Notification.name)
    private notifModel: Model<NotificationDocument>,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Company.name)
    private companyModel: Model<CompanyDocument>

  ) { }

  /* -------------------------------------------
   * Generate Random Token
   * -----------------------------------------*/
  private generateToken() {
    return crypto.randomBytes(16).toString("hex");
  }

  /* -------------------------------------------
   * Create Project (Multi-Tenant)
   * -----------------------------------------*/
  async createProject(ownerId: string, dto: CreateProjectDto) {
    // 1. Fetch owner user
    const owner = await this.userModel.findById(ownerId);
    if (!owner) throw new NotFoundException("Owner user not found");

    // 2. Owner must belong to a company
    if (!owner.company) {
      throw new BadRequestException(
        "You must belong to a company to create a project"
      );
    }

    // 3. Generate invite token
    const inviteToken = this.generateToken();

    // 4. Create project with required multi-tenant reference
    const project = await this.projectModel.create({
      name: dto.name,
      repoUrl: dto.repoUrl,
      owner: ownerId,
      members: [],
      inviteToken,
      company: owner.company, // <--- REQUIRED
    });

    // 5. Invite members (optional)
    if (dto.emails && dto.emails.length > 0) {
      for (const email of dto.emails) {
        const user = await this.userModel.findOne({ email });
        if (!user) continue;

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
          title: "Project Invitation",
          body: `You have been invited to join the project: ${project.name}`,
          data: { projectId: project._id, inviteToken: individualToken },
        });

        console.log(
          `(Email placeholder) Sent invitation email to ${email} with token ${individualToken}`
        );
      }
    }

    return {
      success: true,
      statusCode: 201,
      data: project,
    };
  }

  /* -------------------------------------------
   * Validate Email
   * -----------------------------------------*/
  async findUserByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  /* -------------------------------------------
   * Get Projects for User (filtered by company)
   * -----------------------------------------*/
  async getUserProjects(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user || !user.company) {
      throw new BadRequestException("User does not belong to a company");
    }

    const projects = await this.projectModel
      .find({
        company: user.company, // <--- MULTI-TENANT FIX
        $or: [{ owner: userId }, { members: userId }],
      })
      .select("-inviteToken")
      .populate("owner", "name email")
      .populate("members", "name email");

    return {
      success: true,
      statusCode: 200,
      data: projects,
    };
  }

  /* -------------------------------------------
   * Get Single Project (with company protection)
   * -----------------------------------------*/
  async getProjectById(projectId: string) {
    if (!Types.ObjectId.isValid(projectId))
      throw new BadRequestException("Invalid project ID");

    const project = await this.projectModel
      .findById(projectId)
      .populate("owner", "name email")
      .populate("members", "name email");

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return {
      success: true,
      statusCode: 200,
      data: project,
    };
  }

  async addMember(projectId: string, requesterId: string, userId: string) {
    // validate ids
    if (!Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid ids');
    }

    // load project & requester & target user
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    const requester = await this.userModel.findById(requesterId);
    if (!requester) throw new NotFoundException('Requester not found');

    // permission: requester must be in same company and be owner|senior
    if (!requester.company || project.company?.toString() !== requester.company.toString()) {
      throw new ForbiddenException('Not allowed (company mismatch)');
    }
    if (!['owner', 'senior'].includes(requester.role)) {
      throw new ForbiddenException('Only owner or senior can add members');
    }

    // find target user
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User to add not found');

    // target must belong to same company (or be unassigned—optional policy)
    if (!user.company) {
      // optional: assign user's company if you want auto-join (be careful)
      // user.company = project.company;
      // await user.save();
      throw new BadRequestException('User does not belong to this company');
    }
    if (user.company.toString() !== project.company.toString()) {
      throw new BadRequestException('User belongs to another company');
    }

    // avoid duplicates
    const alreadyMember = project.members.some((m: any) => m.toString() === user._id.toString());
    if (alreadyMember) {
      return { success: true, statusCode: 200, message: 'User already a member', data: project };
    }

    // add member
    project.members.push(user._id);
    await project.save();

    // add notification
    await this.notifModel.create({
      user: user._id,
      title: 'Added to project',
      body: `You were added to project ${project.name}`,
      data: { projectId: project._id },
    });

    return { success: true, statusCode: 200, data: project };
  }

  async removeMember(projectId: string, requesterId: string, userId: string) {
    if (!Types.ObjectId.isValid(projectId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid ids');
    }

    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');

    const requester = await this.userModel.findById(requesterId);
    if (!requester) throw new NotFoundException('Requester not found');

    if (!requester.company || project.company?.toString() !== requester.company.toString()) {
      throw new ForbiddenException('Not allowed (company mismatch)');
    }
    if (!['owner', 'senior'].includes(requester.role)) {
      throw new ForbiddenException('Only owner or senior can remove members');
    }

    // can't remove owner
    if (project.owner?.toString() === userId) {
      throw new BadRequestException('Cannot remove project owner');
    }

    const idx = project.members.findIndex((m: any) => m.toString() === userId);
    if (idx === -1) {
      return { success: true, statusCode: 200, message: 'User not a member', data: project };
    }

    project.members.splice(idx, 1);
    await project.save();

    // notification
    await this.notifModel.create({
      user: userId,
      title: 'Removed from project',
      body: `You were removed from project ${project.name}`,
      data: { projectId: project._id },
    });

    return { success: true, statusCode: 200, data: project };
  }

  async inviteMember(projectId: string, inviterId: string, email: string) {
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    const inviter = await this.userModel.findById(inviterId);
    if (!inviter) throw new NotFoundException("Inviter not found");

    if (!inviter.company || inviter.company.toString() !== project.company.toString()) {
      throw new ForbiddenException("You cannot invite members to this project");
    }

    if (!["owner", "senior"].includes(inviter.role)) {
      throw new ForbiddenException("Only owner or senior can invite users");
    }

    const user = await this.userModel.findOne({ email });

    // EXISTING USER BUT DIFFERENT COMPANY → BLOCK
    if (user && user.company && user.company.toString() !== project.company.toString()) {
      throw new BadRequestException("User belongs to another company");
    }

    // NEW TOKEN
    const inviteToken = crypto.randomBytes(16).toString("hex");

    // EXISTING USER (with OR without company)
    if (user) {
      await this.inviteModel.create({
        project: projectId,
        to: user._id,
        from: inviterId,
        inviteToken,
        status: InviteStatus.PENDING,
      });

      await this.notifModel.create({
        user: user._id,
        title: "Project Invitation",
        body: `You were invited to join project ${project.name}`,
        data: { projectId, inviteToken },
      });

      return {
        success: true,
        message: "Invitation sent",
        inviteToken,
      };
    }

    // USER NOT REGISTERED
    return {
      success: true,
      message: "User not registered — send invite via email signup",
      inviteToken,
    };
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.inviteModel.findOne({ inviteToken: token });
    if (!invite) throw new NotFoundException("Invalid or expired invite");

    if (invite.status !== InviteStatus.PENDING) {
      throw new BadRequestException("Invite already used");
    }

    const project = await this.projectModel.findById(invite.project);
    if (!project) throw new NotFoundException("Project not found");

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    // If new user or no company → auto assign to project company
    if (!user.company) {
      user.company = project.company;
      user.role = "developer";
      await user.save();

      await this.companyModel.findByIdAndUpdate(project.company, {
        $addToSet: { employees: user._id },
      });
    }

    // If user belongs to wrong company (rare)
    if (user.company.toString() !== project.company.toString()) {
      throw new BadRequestException("You cannot join a project from another company");
    }

    // Add to project members
    await this.projectModel.findByIdAndUpdate(project._id, {
      $addToSet: { members: user._id },
    });

    // Update invite
    invite.status = InviteStatus.ACCEPTED;
    await invite.save();

    return {
      success: true,
      message: "You successfully joined the project",
    };
  }

  async getCompanyEmployeesForProject(projectId: string, requesterId: string) {
    // requester
    const requester = await this.userModel.findById(requesterId);
    if (!requester) throw new NotFoundException("Requester not found");
    if (!requester.company) throw new ForbiddenException("Not part of any company");

    // project
    const project = await this.projectModel.findById(projectId);
    if (!project) throw new NotFoundException("Project not found");

    if (!project.company) {
      throw new BadRequestException("Project has no company assigned");
    }

    // must match company
    if (requester.company.toString() !== project.company.toString()) {
      throw new ForbiddenException("Not allowed (company mismatch)");
    }

    // fetch employees of same company
    const employees = await this.userModel.find(
      { company: project.company },
      "name email role"
    );

    return employees;
  }

}
