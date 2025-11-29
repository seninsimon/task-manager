    import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ProjectInvite, ProjectInviteDocument, InviteStatus } from './shemas/project-invite.schema';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './shemas/project.schema';
import { Notification  } from './shemas/notification.schema';

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(ProjectInvite.name) private inviteModel: Model<ProjectInviteDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<any>,
  ) {}

  async acceptInvite(userId: string, token: string) {
    const invite = await this.inviteModel.findOne({ inviteToken: token });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.to.toString() !== userId) throw new BadRequestException('Invalid user');
    if (invite.status !== InviteStatus.PENDING) throw new BadRequestException('Already processed');

    invite.status = InviteStatus.ACCEPTED;
    await invite.save();

    await this.projectModel.updateOne(
      { _id: invite.project },
      { $addToSet: { members: invite.to } }
    );

    return { message: 'Invite accepted' };
  }

  async rejectInvite(userId: string, token: string) {
    const invite = await this.inviteModel.findOne({ inviteToken: token });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.to.toString() !== userId) throw new BadRequestException('Invalid user');
    if (invite.status !== InviteStatus.PENDING) throw new BadRequestException('Already processed');

    invite.status = InviteStatus.REJECTED;
    await invite.save();

    return { message: 'Invite rejected' };
  }
}
