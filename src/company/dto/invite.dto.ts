import { IsString, IsEmail, IsNotEmpty } from "class-validator";

export class CompanyInviteDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
