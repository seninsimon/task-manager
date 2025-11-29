import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectInviteDocument = HydratedDocument<ProjectInvite>;

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

@Schema({ timestamps: true })
export class ProjectInvite {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  project: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  to: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  from: Types.ObjectId;

  @Prop({ enum: InviteStatus, default: InviteStatus.PENDING })
  status: InviteStatus;

  @Prop({ unique: true })
  inviteToken: string;
}

export const ProjectInviteSchema = SchemaFactory.createForClass(ProjectInvite);
