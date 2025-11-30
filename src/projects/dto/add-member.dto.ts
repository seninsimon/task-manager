// dto/add-member.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class AddMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
