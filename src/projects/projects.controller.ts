import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProject(@Req() req, @Body() dto: CreateProjectDto) {
    const userId = req.user.userId;
    const project = await this.projectsService.createProject(userId, dto);
     return {
    success: true,
    statusCode: 201,
    data: project,   
  };
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
}
