import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  _id?: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
