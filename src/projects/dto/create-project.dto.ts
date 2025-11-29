import { IsArray, IsOptional, IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  repoUrl?: string;

  @IsOptional()
  @IsArray()
  emails?: string[];
}
