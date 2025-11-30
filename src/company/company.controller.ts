import { Body, Controller, Post, UseGuards, Req, Get, Param, Patch } from "@nestjs/common";
import { CompanyService } from "./company.service";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { CompanyInviteDto } from "./dto/invite.dto";
import { JoinCompanyDto } from "./dto/join-company.dto";

@Controller("companies")
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // create a company (owner becomes admin)
  @UseGuards(JwtAuthGuard)
  @Post()
  async createCompany(@Req() req, @Body() dto: CreateCompanyDto) {
    const userId = req.user.userId;
    const company = await this.companyService.createCompany(userId, dto.name);
    return { success: true, statusCode: 201, data: company };
  }

  // get my company
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMyCompany(@Req() req) {
    const user = req.user;
    if (!user.company) return { success: false, message: "No company" };
    const company = await this.companyService.getCompanyById(user.company);
    return { success: true, data: company };
  }

  // invite an employee (owner or senior)
  @UseGuards(JwtAuthGuard)
  @Post(":companyId/invite")
  async invite(@Req() req, @Param("companyId") companyId: string, @Body() dto: CompanyInviteDto) {
    const userId = req.user.userId;
    const res = await this.companyService.inviteEmployee(companyId, userId, dto.email);
    return { success: true, data: res };
  }

  // join company with invite token
  @UseGuards(JwtAuthGuard)
  @Post("join")
  async join(@Req() req, @Body() dto: JoinCompanyDto) {
    const userId = req.user.userId;
    const res = await this.companyService.joinCompanyWithToken(dto.inviteToken, userId);
    return { success: true, data: res };
  }

  // owner can change role
  @UseGuards(JwtAuthGuard)
  @Patch(":companyId/role/:userId")
  async setRole(@Req() req, @Param("companyId") companyId: string, @Param("userId") userId: string, @Body() body: { role: "owner" | "senior" | "developer" }) {
    const adminId = req.user.userId;
    const updated = await this.companyService.setUserRole(companyId, adminId, userId, body.role);
    return { success: true, data: updated };
  }
}
