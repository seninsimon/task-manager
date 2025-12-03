import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Notification, NotificationDocument } from "./schemas/notification.schema"

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>
  ) { }

  // Get notifications for user
  async getMyNotifications(userId: string) {
    return await this.notificationModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  // Count unread notifications
  async getUnreadCount(userId: string) {
    return await this.notificationModel.countDocuments({
      user: new Types.ObjectId(userId),
      read: false,
    });
  }

  // Mark one as read
  async markAsRead(notificationId: string, userId: string) {
    return await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
  }

  // Mark all as read
  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { user: userId },
      { read: true }
    );
    return { message: "All notifications marked as read" };
  }


  async createNotification(payload: {
    user: string | Types.ObjectId;
    title: string;
    body: string;
    data?: any;
  }) {
    return this.notificationModel.create({
      user: payload.user,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    });
  }

}
