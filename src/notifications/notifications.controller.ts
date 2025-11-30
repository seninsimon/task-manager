import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req) {
    return await this.notifService.getMyNotifications(req.user.userId);
  }

  @Get("unread-count")
  async getUnreadCount(@Req() req) {
    return await this.notifService.getUnreadCount(req.user.userId);
  }

  @Patch(":id/read")
  async markRead(@Param("id") id: string, @Req() req) {
    return await this.notifService.markAsRead(id, req.user.userId);
  }

  @Patch("read/all")
  async markAll(@Req() req) {
    return await this.notifService.markAllAsRead(req.user.userId);
  }
}
