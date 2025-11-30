import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Company, CompanyDocument } from "./schema/company.schema";
import { User, UserDocument } from "src/users/schemas/user.schema";
import * as crypto from "crypto";

@Injectable()
export class CompanyService {
    constructor(
        @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    private generateToken() {
        return crypto.randomBytes(16).toString("hex");
    }

    async createCompany(ownerId: string, name: string) {
        const inviteToken = this.generateToken();

        const ownerObjectId = new Types.ObjectId(ownerId);

        const company = await this.companyModel.create({
            name,
            owner: ownerObjectId,
            employees: [ownerObjectId],
            inviteToken,
        });

        // update user -> set company and role owner
        await this.userModel.findByIdAndUpdate(ownerId, {
            company: company._id,
            role: "owner",
        });

        return company;
    }


    async getCompanyById(companyId: string) {
        const company = await this.companyModel
            .findById(companyId)
            .populate("owner", "name email role")
            .populate("employees", "name email role");

        if (!company) throw new NotFoundException("Company not found");
        return company;
    }

    async inviteEmployee(companyId: string, inviterId: string, email: string) {
        const company = await this.companyModel.findById(companyId);
        if (!company) throw new NotFoundException("Company not found");

        const inviter = await this.userModel.findById(inviterId);

        if (!inviter || !(inviter.company?.toString() === companyId)) {
            throw new ForbiddenException("Inviter not part of company");
        }

        if (!["owner", "senior"].includes(inviter.role)) {
            throw new ForbiddenException("Only owner or senior can invite");
        }

        const existingUser = await this.userModel.findOne({ email });

        if (existingUser && existingUser.company?.toString() === companyId) {
            throw new BadRequestException("User already in this company");
        }

        if (existingUser && existingUser.company) {
            throw new BadRequestException("User already in another company");
        }

        if (existingUser) {
            existingUser.company = company._id;
            existingUser.role = "developer";
            await existingUser.save();

            company.employees.push(existingUser._id);
            await company.save();

            return { message: "Existing user added", user: existingUser };
        }

        return {
            inviteToken: company.inviteToken,
            email,
            message: "Send this invite token to the new user",
        };
    }

    async joinCompanyWithToken(inviteToken: string, userId: string) {
        const company = await this.companyModel.findOne({ inviteToken });
        if (!company) throw new NotFoundException("Invalid invite token");

        const user = await this.userModel.findById(userId);
        if (!user) throw new NotFoundException("User not found");

        if (user.company && user.company.toString() !== company._id.toString()) {
            throw new BadRequestException("User already in another company");
        }

        if (!user.company) {
            user.company = company._id;
            user.role = "developer";
            await user.save();

            company.employees.push(user._id);
            await company.save();
        }

        return { message: "Joined company", company };
    }

    async setUserRole(companyId: string, adminId: string, userId: string, role: "owner" | "senior" | "developer") {
        const company = await this.companyModel.findById(companyId);
        if (!company) throw new NotFoundException("Company not found");

        if (company.owner.toString() !== adminId) {
            throw new ForbiddenException("Only owner can update roles");
        }

        const user = await this.userModel.findById(userId);
        if (!user || user.company?.toString() !== companyId) {
            throw new BadRequestException("User not in company");
        }

        user.role = role;
        await user.save();
        return user;
    }
}
