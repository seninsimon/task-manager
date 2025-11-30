import { IsString, IsNotEmpty } from "class-validator";

export class JoinCompanyDto {
  @IsString()
  @IsNotEmpty()
  inviteToken: string;
}
