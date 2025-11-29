import { Controller, Post, Param, Req, UseGuards } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('invites')
export class InvitesController {
  constructor(private invitesService: InvitesService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':token/accept')
  accept(@Req() req, @Param('token') token: string) {
    return this.invitesService.acceptInvite(req.user.id, token);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':token/reject')
  reject(@Req() req, @Param('token') token: string) {
    return this.invitesService.rejectInvite(req.user.id, token);
  }
}
