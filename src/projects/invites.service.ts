import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ProjectInvite, ProjectInviteDocument, InviteStatus } from './shemas/project-invite.schema';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './shemas/project.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { Company, CompanyDocument } from 'src/company/schema/company.schema';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(ProjectInvite.name) private inviteModel: Model<ProjectInviteDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private notificationsService: NotificationsService, // <- FIXED
  ) {}

  /* --------------------------------------------------------------
   * ACCEPT INVITE
   * -------------------------------------------------------------- */
  async acceptInvite(userId: string, token: string) {
    const invite = await this.inviteModel.findOne({ inviteToken: token });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.to.toString() !== userId) throw new BadRequestException('Invalid user');
    if (invite.status !== InviteStatus.PENDING) throw new BadRequestException('Already processed');

    invite.status = InviteStatus.ACCEPTED;
    await invite.save();

    // Load project with company populated
    const project = await this.projectModel
      .findById(invite.project)
      .populate("company");

    if (!project) throw new NotFoundException("Project not found");

    // Add user to company
    await this.companyModel.updateOne(
      { _id: project.company._id },
      { $addToSet: { employees: invite.to } }
    );

    // Add user to project
    await this.projectModel.updateOne(
      { _id: invite.project },
      { $addToSet: { members: invite.to } }
    );

    return { message: 'Invite accepted' };
  }

  /* --------------------------------------------------------------
   * REJECT INVITE
   * -------------------------------------------------------------- */
  async rejectInvite(userId: string, token: string) {
    const invite = await this.inviteModel.findOne({ inviteToken: token });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.to.toString() !== userId) throw new BadRequestException('Invalid user');
    if (invite.status !== InviteStatus.PENDING) throw new BadRequestException('Already processed');

    invite.status = InviteStatus.REJECTED;
    await invite.save();

    return { message: 'Invite rejected' };
  }

  /* --------------------------------------------------------------
   * INVITE BY EMAIL
   * -------------------------------------------------------------- */
 async inviteByEmail(projectId: string, email: string, fromUserId: string) {
  const project = await this.projectModel
    .findById(projectId)
    .populate("company")
    .populate("members");

  if (!project) throw new NotFoundException("Project not found");

  // find user by email
  const user = await this.userModel.findOne({ email });

  if (!user) {
    throw new BadRequestException("User with this email does not exist");
  }

  // Already in project?
  const isMember = project.members.some(
    (m: any) => m.toString() === user._id.toString()
  );
  if (isMember) throw new BadRequestException("User already in project");

  // Already invited?
  const existingInvite = await this.inviteModel.findOne({
    project: projectId,
    to: user._id,
    status: InviteStatus.PENDING,
  });

  if (existingInvite) {
    throw new BadRequestException("User already has a pending invite");
  }

  // Check company membership
  const company = project.company as any;
  const isCompanyMember = company.employees?.some(
    (e: any) => e.toString() === user._id.toString()
  );

  // Generate token
  const inviteToken = Math.random().toString(36).substring(2, 15);

  // Save invite
  await this.inviteModel.create({
    project: project._id,
    to: user._id,
    from: fromUserId,
    inviteToken,
    status: InviteStatus.PENDING,
  });

  // 🔥🔥🔥 ADD THIS — CREATE NOTIFICATION
  await this.notificationsService.createNotification({
    user: user._id,
    title: "Project Invitation",
    body: `You were invited to join project "${project.name}"`,
    data: {
      projectId: project._id.toString(),
      inviteToken,
      type: "project_invite",
    }
  });

  return {
    message: "Invite sent",
    inviteToken,
    userAlreadyInCompany: isCompanyMember,
  };
}

}
