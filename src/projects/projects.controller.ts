import { Controller, Get, Post, Body, Query, Req, UseGuards, Param, Delete, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { AddMemberDto } from './dto/add-member.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProject(@Req() req, @Body() dto: CreateProjectDto) {
    const userId = req.user.userId;
    return await this.projectsService.createProject(userId, dto);
  }

  @Get('user-by-email')
  async findUserByEmail(@Query('email') email: string) {
    const user = await this.projectsService.findUserByEmail(email);
    return { found: !!user, user };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyProjects(@Req() req) {
    return this.projectsService.getUserProjects(req.user.userId);
  }


  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getProjectById(@Param('id') id: string) {
    return this.projectsService.getProjectById(id);
  }


  @UseGuards(JwtAuthGuard)
  @Post(':projectId/members')
  async addMember(
    @Req() req,
    @Param('projectId') projectId: string,
    @Body() dto: AddMemberDto,
  ) {
    const requesterId = req.user.userId;
    return await this.projectsService.addMember(projectId, requesterId, dto.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':projectId/members/:userId')
  async removeMember(
    @Req() req,
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
  ) {
    const requesterId = req.user.userId;
    return await this.projectsService.removeMember(projectId, requesterId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':projectId/company-employees')
  async getCompanyEmployees(@Req() req, @Param('projectId') projectId: string) {
    const requesterId = req.user.userId;

    const employees =
      await this.projectsService.getCompanyEmployeesForProject(
        projectId,
        requesterId
      );

    return employees;
  }

  @UseGuards(JwtAuthGuard)
  @Post(':projectId/invite')
  inviteToProject(
    @Param('projectId') projectId: string,
    @Body('email') email: string,
    @Req() req
  ) {
    return this.projectsService.inviteMember(projectId, req.user.userId, email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invites/accept')
  acceptInvite(@Body('token') token: string, @Req() req) {
    return this.projectsService.acceptInvite(token, req.user.userId);
  }

  


}
