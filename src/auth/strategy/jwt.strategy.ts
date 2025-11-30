import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'secretKey',
    });
  }

  async validate(payload: { id: string; email: string }) {
    // Fetch full user from DB
    const user = await this.usersService.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      company: user.company ? user.company.toString() : null,
      role: user.role || "developer",
    };
  }
}
