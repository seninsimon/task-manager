import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Company, CompanySchema } from "./schema/company.schema";
import { CompanyController } from "./company.controller";
import { CompanyService } from "./company.service";
import { User, UserSchema } from "src/users/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema }, // we need users model here to update them
    ]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
